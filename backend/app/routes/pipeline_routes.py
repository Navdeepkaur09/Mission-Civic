import logging
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from backend.app.utils.detection_pipeline import CivicResolveDetectionPipeline

logger = logging.getLogger("pipeline-routes")
router = APIRouter(prefix="/pipeline", tags=["Image Processing Pipeline"])

# Instantiate the pipeline with TensorFlow by default
pipeline = CivicResolveDetectionPipeline(model_type="tensorflow")

class DetectionRequest(BaseModel):
    image: str = Field(
        ..., 
        description="The base64 encoded image string representing the municipal incident photo."
    )

class DetectionResponse(BaseModel):
    issueDetected: str = Field(..., description="The type of issue detected, e.g., 'Pothole / Road Cavity'.")
    category: str = Field(..., description="Classification category: pothole, garbage, leakage, streetlight, road_damage, other.")
    severity: str = Field(..., description="Estimated priority severity: low, medium, high.")
    confidence: float = Field(..., description="Model confidence level between 0.0 and 1.0.")
    reasoning: str = Field(..., description="Full analytical text detailing why the model classified the image as such.")
    department: str = Field(..., description="Assigned city municipal department.")
    priorityScore: int = Field(..., description="Urgency priority rating from 1 to 100.")
    estimatedResolutionTime: str = Field(..., description="Estimated timeline to fix, e.g. '24-48 hours', '3-5 days'.")

@router.post("/detect", response_model=DetectionResponse, status_code=status.HTTP_200_OK)
async def process_image_via_pipeline(payload: DetectionRequest):
    """
    Inference endpoint for the local AI image processing pipeline.
    Accepts a base64-encoded image, runs computer vision analysis using TensorFlow/YOLO or local heuristics,
    and returns a structured classification response.
    """
    if not payload.image:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request body must contain a non-empty base64 'image' string."
        )

    try:
        # Run detection pipeline
        detection_result = pipeline.detect_issue(payload.image)
        return detection_result
    except ValueError as val_err:
        logger.error(f"Value error during image decoding: {val_err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as err:
        logger.error(f"Internal pipeline failure: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image processing pipeline failed: {err}"
        )
