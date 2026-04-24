import io
import time
import logging

from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import StreamingResponse
from PIL import Image
from rembg import remove

logger = logging.getLogger(__name__)

health_router = APIRouter()
image_router = APIRouter()

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB
ALLOWED_TYPES = {"image/png", "image/jpeg", "image/webp", "image/bmp", "image/tiff"}


@health_router.get("/health")
async def health_check():
    from app.database import is_connected
    return {
        "status": "healthy",
        "service": "pixelforge-api",
        "version": "2.0.0",
        "database": "connected" if is_connected() else "disconnected",
    }


@image_router.post("/remove-background")
async def remove_background(
    image: UploadFile = File(...),
    output_format: str = Query(default="png", regex="^(png|webp)$"),
    max_width: int = Query(default=3840, ge=100, le=7680),
    max_height: int = Query(default=2160, ge=100, le=4320),
):
    """
    Remove background from an uploaded image.

    - Accepts PNG, JPEG, WebP, BMP, TIFF
    - Returns transparent PNG or WebP
    - Supports up to 4K output resolution
    """
    # Validate content type
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type: {image.content_type}. "
                   f"Allowed: {', '.join(ALLOWED_TYPES)}",
        )

    # Read and validate file size
    contents = await image.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)} MB",
        )

    try:
        start_time = time.time()

        # Open and process the image
        input_image = Image.open(io.BytesIO(contents))
        logger.info(
            f"Processing image: {input_image.size[0]}x{input_image.size[1]}, "
            f"format={input_image.format}"
        )

        # Remove background using rembg (U2Net model)
        result_image = remove(input_image)

        # Resize if larger than requested max dimensions (preserve aspect ratio)
        if result_image.width > max_width or result_image.height > max_height:
            result_image.thumbnail((max_width, max_height), Image.LANCZOS)
            logger.info(f"Resized output to: {result_image.size[0]}x{result_image.size[1]}")

        # Ensure RGBA for transparency
        if result_image.mode != "RGBA":
            result_image = result_image.convert("RGBA")

        # Encode output
        output_buffer = io.BytesIO()
        if output_format == "webp":
            result_image.save(output_buffer, format="WEBP", quality=95, lossless=True)
            media_type = "image/webp"
        else:
            result_image.save(output_buffer, format="PNG", optimize=True)
            media_type = "image/png"

        output_buffer.seek(0)

        elapsed = time.time() - start_time
        logger.info(f"Background removed in {elapsed:.2f}s")

        return StreamingResponse(
            output_buffer,
            media_type=media_type,
            headers={
                "X-Processing-Time": f"{elapsed:.2f}s",
                "X-Output-Size": f"{result_image.size[0]}x{result_image.size[1]}",
            },
        )

    except Exception as e:
        logger.error(f"Background removal failed: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@image_router.post("/enhance")
async def enhance_image(
    image: UploadFile = File(...),
    brightness: float = Query(default=1.0, ge=0.0, le=3.0),
    contrast: float = Query(default=1.0, ge=0.0, le=3.0),
    sharpness: float = Query(default=1.0, ge=0.0, le=3.0),
):
    """
    Apply basic image enhancements: brightness, contrast, sharpness.
    """
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    contents = await image.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")

    try:
        from PIL import ImageEnhance

        img = Image.open(io.BytesIO(contents))

        if brightness != 1.0:
            img = ImageEnhance.Brightness(img).enhance(brightness)
        if contrast != 1.0:
            img = ImageEnhance.Contrast(img).enhance(contrast)
        if sharpness != 1.0:
            img = ImageEnhance.Sharpness(img).enhance(sharpness)

        output_buffer = io.BytesIO()
        fmt = "PNG" if img.mode == "RGBA" else "JPEG"
        img.save(output_buffer, format=fmt, quality=95)
        output_buffer.seek(0)

        media_type = "image/png" if fmt == "PNG" else "image/jpeg"
        return StreamingResponse(output_buffer, media_type=media_type)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enhancement failed: {str(e)}")
