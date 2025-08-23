from fastapi import APIRouter
from fastapi.responses import Response
import random

router = APIRouter()

@router.get("/placeholder/{width}/{height}")
async def get_placeholder_image(width: int, height: int):
    """
    生成 SVG 格式的占位图片
    
    Args:
        width: 图片宽度
        height: 图片高度
    
    Returns:
        SVG 格式的占位图片
    """
    # 限制图片尺寸，防止滥用
    width = min(max(width, 1), 1000)
    height = min(max(height, 1), 1000)
    
    # 生成随机背景色（柔和的颜色）
    colors = [
        "#6c757d",  # 灰色
        "#343a40",  # 深灰
        "#495057",  # 中灰
        "#868e96",  # 浅灰
        "#adb5bd",  # 更浅灰
    ]
    bg_color = random.choice(colors)
    
    # 计算字体大小
    font_size = min(width, height) // 8
    font_size = max(font_size, 12)  # 最小字体大小
    
    # 生成 SVG
    svg_content = f'''<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="{width}" height="{height}" fill="{bg_color}"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="{font_size}" 
          fill="white" text-anchor="middle" dominant-baseline="middle">
        {width}×{height}
    </text>
</svg>'''
    
    return Response(
        content=svg_content,
        media_type="image/svg+xml",
        headers={"Cache-Control": "public, max-age=3600"}  # 缓存1小时
    )