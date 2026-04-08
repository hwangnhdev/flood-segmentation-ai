"""
model.py  –  ViT-UNet architecture (ConvNeXt-Tiny backbone)
Extracted verbatim from the training notebook.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import timm


# ─── Attention Gate ────────────────────────────────────────────────────────────
class AttentionGate(nn.Module):
    def __init__(self, g_channels, x_channels, inter_channels):
        super().__init__()
        self.w_g   = nn.Conv2d(g_channels,   inter_channels, kernel_size=1)
        self.w_x   = nn.Conv2d(x_channels,   inter_channels, kernel_size=1)
        self.psi   = nn.Conv2d(inter_channels, 1,            kernel_size=1)
        self.relu  = nn.ReLU(inplace=True)
        self.sigmoid = nn.Sigmoid()

    def forward(self, g, x):
        g1  = self.w_g(g)
        x1  = self.w_x(x)
        psi = self.relu(g1 + x1)
        psi = self.psi(psi)
        psi = self.sigmoid(psi)
        return x * psi


# ─── ASPP ──────────────────────────────────────────────────────────────────────
class ASPP(nn.Module):
    def __init__(self, in_channels, out_channels=512, rates=None):
        super().__init__()
        if rates is None:
            rates = [1, 6, 12, 18]
        self.aspp1 = nn.Conv2d(in_channels, out_channels, 1)
        self.aspp2 = nn.Conv2d(in_channels, out_channels, 3, padding=rates[1], dilation=rates[1])
        self.aspp3 = nn.Conv2d(in_channels, out_channels, 3, padding=rates[2], dilation=rates[2])
        self.aspp4 = nn.Conv2d(in_channels, out_channels, 3, padding=rates[3], dilation=rates[3])
        self.global_pool = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Conv2d(in_channels, out_channels, 1),
            nn.ReLU(inplace=True),
        )
        self.out_conv = nn.Conv2d(out_channels * 5, out_channels, 1)
        self.bn   = nn.BatchNorm2d(out_channels)
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x):
        f1 = self.aspp1(x)
        f2 = self.aspp2(x)
        f3 = self.aspp3(x)
        f4 = self.aspp4(x)
        f5 = self.global_pool(x)
        f5 = F.interpolate(f5, size=x.shape[2:], mode="bilinear", align_corners=False)
        out = torch.cat([f1, f2, f3, f4, f5], dim=1)
        out = self.out_conv(out)
        out = self.bn(out)
        return self.relu(out)


# ─── Transformer Block ─────────────────────────────────────────────────────────
class TransformerBlock(nn.Module):
    def __init__(self, dim, heads=8, mlp_ratio=4.0):
        super().__init__()
        self.norm1 = nn.LayerNorm(dim)
        self.attn  = nn.MultiheadAttention(embed_dim=dim, num_heads=heads, batch_first=True)
        self.norm2 = nn.LayerNorm(dim)
        self.mlp   = nn.Sequential(
            nn.Linear(dim, int(dim * mlp_ratio)),
            nn.GELU(),
            nn.Linear(int(dim * mlp_ratio), dim),
        )

    def forward(self, x):
        x = x + self.attn(self.norm1(x), self.norm1(x), self.norm1(x))[0]
        x = x + self.mlp(self.norm2(x))
        return x


# ─── Decoder Block ─────────────────────────────────────────────────────────────
class DecoderBlock(nn.Module):
    def __init__(self, in_channels, skip_channels, out_channels):
        super().__init__()
        self.up = nn.Sequential(
            nn.Upsample(scale_factor=2, mode="bilinear", align_corners=False),
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
        )
        self.att_gate = (
            AttentionGate(out_channels, skip_channels, out_channels // 2)
            if skip_channels > 0
            else None
        )
        total_in = out_channels + skip_channels if skip_channels > 0 else out_channels
        self.conv = nn.Sequential(
            nn.Conv2d(total_in, out_channels, 3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, 3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
        )

    def forward(self, x, skip=None):
        x = self.up(x)
        if skip is not None and self.att_gate is not None:
            skip = F.interpolate(skip, size=x.shape[2:], mode="bilinear", align_corners=False)
            skip = self.att_gate(x, skip)
        if skip is not None:
            x = torch.cat([x, skip], dim=1)
        return self.conv(x)


# ─── Hybrid Encoder ────────────────────────────────────────────────────────────
class HybridEncoder(nn.Module):
    def __init__(self, img_size=512, patch_size=4, dim=512, depth=12,
                 backbone_name="convnext_tiny"):
        super().__init__()
        self.backbone_name = backbone_name
        self.backbone = timm.create_model(backbone_name, pretrained=False, features_only=True)

        if "resnet50" in backbone_name:
            self.patch_in_ch  = 1024
            self.skip_channels = [64, 256, 512, 1024]
        elif "convnext_tiny" in backbone_name or "convnext_small" in backbone_name:
            self.patch_in_ch  = 768
            self.skip_channels = [96, 192, 384, 768]
        elif "convnext_base" in backbone_name:
            self.patch_in_ch  = 1024
            self.skip_channels = [128, 256, 512, 1024]
        else:
            raise ValueError(f"Unsupported backbone: {backbone_name}")

        self.patch_embed = nn.Conv2d(self.patch_in_ch, dim, kernel_size=patch_size, stride=patch_size)
        max_patches = (32 // 2) ** 2
        self.pos_embedding = nn.Parameter(torch.randn(1, max_patches, dim))
        self.blocks = nn.ModuleList([TransformerBlock(dim) for _ in range(depth)])

    def forward(self, x):
        features = self.backbone(x)
        x1, x2, x3, x4 = features[0], features[1], features[2], features[3]
        patch_feat = self.patch_embed(x4)
        B, C, h, w = patch_feat.shape
        num_patches = h * w
        pos    = self.pos_embedding[:, :num_patches, :]
        tokens = patch_feat.flatten(2).transpose(1, 2)
        tokens = tokens + pos
        for blk in self.blocks:
            tokens = blk(tokens)
        return tokens, x1, x2, x3, x4, h, w


# ─── ViT-UNet ──────────────────────────────────────────────────────────────────
class ViT_UNet(nn.Module):
    def __init__(self, num_classes=10, dim=512, backbone_name="convnext_tiny"):
        super().__init__()
        self.encoder = HybridEncoder(
            img_size=512, patch_size=4, dim=dim, depth=12, backbone_name=backbone_name
        )
        skip_ch = self.encoder.skip_channels

        self.aspp = ASPP(dim, dim)
        self.dec1 = DecoderBlock(dim,  skip_ch[3], 256)
        self.dec2 = DecoderBlock(256,  skip_ch[2], 128)
        self.dec3 = DecoderBlock(128,  skip_ch[1],  64)
        self.dec4 = DecoderBlock(64,   skip_ch[0],  32)
        self.dec5 = DecoderBlock(32,            0,  32)

        self.head      = nn.Conv2d(32,  num_classes, 1)
        self.aux_head2 = nn.Conv2d(128, num_classes, 1)
        self.aux_head3 = nn.Conv2d(64,  num_classes, 1)

    def forward(self, x):
        tokens, x1, x2, x3, x4, H, W = self.encoder(x)
        B, N, C = tokens.shape
        feat = tokens.transpose(1, 2).reshape(B, C, H, W)
        feat = self.aspp(feat)

        feat1 = self.dec1(feat,  x4)
        feat2 = self.dec2(feat1, x3)
        feat3 = self.dec3(feat2, x2)
        feat4 = self.dec4(feat3, x1)
        feat5 = self.dec5(feat4, None)

        main_out = self.head(feat5)
        main_out = F.interpolate(main_out, size=(512, 512), mode="bilinear", align_corners=False)

        aux2 = self.aux_head2(feat2)
        aux2 = F.interpolate(aux2, size=(512, 512), mode="bilinear", align_corners=False)

        aux3 = self.aux_head3(feat3)
        aux3 = F.interpolate(aux3, size=(512, 512), mode="bilinear", align_corners=False)

        return main_out, aux2, aux3
