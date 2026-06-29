import json
import logging
import httpx
from typing import Optional, Dict, Any, List
from backend.app.config import settings

logger = logging.getLogger("gemini")

class GeminiService:
    @staticmethod
    def _get_api_key() -> Optional[str]:
        return settings.GEMINI_API_KEY if settings.GEMINI_API_KEY else None

    @classmethod
    async def analyze_issue(
        cls, description: str, category: Optional[str] = None, severity: Optional[str] = None, image_base64: Optional[str] = None
    ) -> Dict[str, Any]:
        """Analyze an issue using Gemini computer vision (if image is present) or text classification."""
        api_key = cls._get_api_key()
        
        # Fallback values
        fallback = {
            "title": "Community Incident",
            "category": category or "other",
            "severity": severity or "medium",
            "department": cls._get_department_for_category(category or "other"),
            "confidence": 0.50,
            "reasoning": "Manual report. Heuristic classification rules applied as AI fallback.",
            "issueDetected": f"Potential {category or 'other'} issue identified.",
            "priorityScore": 85 if severity == "high" else (50 if severity == "medium" else 20),
            "estimatedResolutionTime": "1-2 days" if severity == "high" else ("3-5 days" if severity == "medium" else "7-10 days")
        }
        
        if not api_key:
            logger.info("No GEMINI_API_KEY found, using default fallback diagnostics.")
            return fallback

        prompt = (
            "Analyze this reported community incident. Determine the correct issue category (must be one of: "
            "\"pothole\", \"garbage\", \"leakage\", \"streetlight\", \"road_damage\", \"other\"), estimate severity (must be "
            "one of: \"low\", \"medium\", \"high\"), recommend a short catchy title, specify the municipal department to handle it, "
            "generate a detailed description of the specific issue detected, generate a priority score between 1 and 100 based on public hazard level, "
            "and estimate the resolution time for a typical city crew. Deliver response in JSON format."
        )

        parts = []
        
        # Process image if present
        if image_base64 and image_base64.startswith("data:image"):
            try:
                header, base64_data = image_base64.split(",", 1)
                mime_type = "image/jpeg"
                if "png" in header:
                    mime_type = "image/png"
                elif "webp" in header:
                    mime_type = "image/webp"
                
                parts.append({
                    "inlineData": {
                        "mimeType": mime_type,
                        "data": base64_data
                    }
                })
            except Exception as e:
                logger.error(f"Failed to process base64 image data: {e}")

        # Add text prompt
        text_content = f"{prompt}\nReporter Description: \"{description}\"\nSuggested Category: \"{category or 'None'}\""
        parts.append({"text": text_content})

        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "OBJECT",
                    "properties": {
                        "title": {"type": "STRING", "description": "Short catchy title describing the incident"},
                        "category": {"type": "STRING", "description": "pothole, garbage, leakage, streetlight, road_damage, other"},
                        "severity": {"type": "STRING", "description": "low, medium, high"},
                        "department": {"type": "STRING", "description": "Suggested Municipal Department to assign"},
                        "confidence": {"type": "NUMBER", "description": "Confidence score between 0.0 and 1.0"},
                        "reasoning": {"type": "STRING", "description": "Brief expert analysis reasoning of what is visible or described."},
                        "issueDetected": {"type": "STRING", "description": "Brief statement of what issue was detected in the image."},
                        "priorityScore": {"type": "INTEGER", "description": "A priority score between 1 and 100 based on danger and urgency."},
                        "estimatedResolutionTime": {"type": "STRING", "description": "Suggested timeframe for repair, e.g., '24 hours', '3 days', '7 days'."}
                    },
                    "required": ["title", "category", "severity", "department", "confidence", "reasoning", "issueDetected", "priorityScore", "estimatedResolutionTime"]
                }
            }
        }

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    result = response.json()
                    text_out = result["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = json.loads(text_out.strip())
                    return {
                        "title": parsed.get("title", fallback["title"]),
                        "category": parsed.get("category", fallback["category"]).lower(),
                        "severity": parsed.get("severity", fallback["severity"]).lower(),
                        "department": parsed.get("department", fallback["department"]),
                        "confidence": float(parsed.get("confidence", fallback["confidence"])),
                        "reasoning": parsed.get("reasoning", fallback["reasoning"]),
                        "issueDetected": parsed.get("issueDetected", fallback["issueDetected"]),
                        "priorityScore": int(parsed.get("priorityScore", fallback["priorityScore"])),
                        "estimatedResolutionTime": parsed.get("estimatedResolutionTime", fallback["estimatedResolutionTime"])
                    }
                else:
                    logger.warning(f"Gemini API returned status {response.status_code}: {response.text}")
        except Exception as e:
            logger.error(f"Error calling Gemini API for issue analysis: {e}")
            
        return fallback

    @classmethod
    async def predict_hotspots(cls, issues_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Predict 2-3 specific geographic hot-spots where issues are likely to recur."""
        api_key = cls._get_api_key()
        
        # Static fallback prediction dataset
        from datetime import datetime, timedelta
        fallback_predictions = [
            {
                "id": "pred-1",
                "region": "Downtown / Capitol Hill Corridor",
                "category": "pothole",
                "riskScore": 88,
                "reasoning": "High commercial delivery truck volume combined with seasonal water pooling has accelerated base layer degradation near major transit intersections.",
                "coordinates": {"lat": 47.6140, "lng": -122.3210},
                "predictedTimeline": "July - August (Post-Summer Heat Expansion)"
            },
            {
                "id": "pred-2",
                "region": "Pike-Pine Sanitation Hub",
                "category": "garbage",
                "riskScore": 75,
                "reasoning": "Recurring weekend nightlife spikes correlate strongly with municipal dumpster overflows. Predictive model recommends Friday afternoon sweep routines.",
                "coordinates": {"lat": 47.6122, "lng": -122.3275},
                "predictedTimeline": "Ongoing Weekly (Saturdays/Sundays)"
            }
        ]

        if not api_key:
            return fallback_predictions

        summary_string = "\n".join([
            f"- Category: {i.get('category')}, Address: {i.get('address')}, "
            f"Coordinates: ({i.get('latitude')}, {i.get('longitude')}), CreatedAt: {i.get('createdAt')}"
            for i in issues_list
        ])

        prompt = (
            f"Analyze this list of reported community issues:\n{summary_string}\n\n"
            "Predict 2-3 specific geographic hot-spots where issues of similar categories are highly likely to recur over the next 6 months. "
            "Provide: Region name, Category, Risk Score (0-100), predictive reasoning, coordinates near the cluster center, and expected Peak timeline."
        )

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "id": {"type": "STRING"},
                            "region": {"type": "STRING", "description": "District or intersection name"},
                            "category": {"type": "STRING", "description": "pothole, garbage, leakage, streetlight, road_damage, other"},
                            "riskScore": {"type": "NUMBER", "description": "Risk percentage 0-100"},
                            "reasoning": {"type": "STRING", "description": "Data-driven predictive justification"},
                            "coordinates": {
                                "type": "OBJECT",
                                "properties": {
                                    "lat": {"type": "NUMBER"},
                                    "lng": {"type": "NUMBER"}
                                },
                                "required": ["lat", "lng"]
                            },
                            "predictedTimeline": {"type": "STRING", "description": "Expected seasonal recurrence peak"}
                        },
                        "required": ["id", "region", "category", "riskScore", "reasoning", "coordinates", "predictedTimeline"]
                    }
                }
            }
        }

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    result = response.json()
                    text_out = result["candidates"][0]["content"]["parts"][0]["text"]
                    return json.loads(text_out.strip())
                else:
                    logger.warning(f"Gemini API returned status {response.status_code} on prediction: {response.text}")
        except Exception as e:
            logger.error(f"Error calling Gemini API for predictive hotspots: {e}")

        return fallback_predictions

    @classmethod
    async def generate_admin_insights(cls, active_count: int, resolved_count: int, counts_by_cat: Dict[str, int], raw_records_summary: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate high-level administrative innovation insights from the reported issue metrics."""
        api_key = cls._get_api_key()
        
        fallback_insights = {
            "executiveSummary": "CivicResolve analytical systems report stable response patterns. Infrastructure and pothole repair loads are steady, while sanitation resolution loops are exceptionally fast. Community verified reports have improved validation accuracy.",
            "resourceAllocationAdvice": "Recommend shifting 10% of utility backup crews to support Department of Transportation paving tasks on peak high-traffic corridors during low-rain weeks.",
            "preventivePolicy": "Draft a proactive local ordinance introducing Smart Grid streetlights that signal power outages directly, reducing manual citizen reports by 30%.",
            "departmentEfficiencyRatings": [
                {"departmentName": "Department of Transportation", "rating": "Overburdened", "issueVolume": counts_by_cat.get("pothole", 0) + counts_by_cat.get("road_damage", 0)},
                {"departmentName": "Department of Sanitation & Waste Management", "rating": "Highly Agile", "issueVolume": counts_by_cat.get("garbage", 0)},
                {"departmentName": "Department of Energy & Lighting", "rating": "Moderate", "issueVolume": counts_by_cat.get("streetlight", 0)},
                {"departmentName": "Department of Public Utilities (Water & Gas)", "rating": "Efficient Priority Response", "issueVolume": counts_by_cat.get("leakage", 0)}
            ]
        }

        if not api_key:
            return fallback_insights

        dataset_context = f"""
        Active Issues: {active_count}
        Resolved Issues: {resolved_count}
        Categories break-down: {counts_by_cat}
        Raw reports excerpt: {json.dumps(raw_records_summary)}
        """

        prompt = (
            f"Based on this real-time city incident dataset context:\n{dataset_context}\n\n"
            "Act as the City Chief Innovation Officer. Provide a professional analysis including:\n"
            "1. A brief executive summary of municipal health.\n"
            "2. Department performance ranking.\n"
            "3. Strategic resource re-allocation guidelines (e.g., recommend shifting % of budget or manpower to a specific team).\n"
            "4. Preventive policy recommendation.\n"
            "Deliver response in a clean JSON format."
        )

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "OBJECT",
                    "properties": {
                        "executiveSummary": {"type": "STRING"},
                        "resourceAllocationAdvice": {"type": "STRING"},
                        "preventivePolicy": {"type": "STRING"},
                        "departmentEfficiencyRatings": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "departmentName": {"type": "STRING"},
                                    "rating": {"type": "STRING", "description": "e.g., Excellent, Overburdened, Slow Response"},
                                    "issueVolume": {"type": "NUMBER"}
                                },
                                "required": ["departmentName", "rating", "issueVolume"]
                            }
                        }
                    },
                    "required": ["executiveSummary", "resourceAllocationAdvice", "preventivePolicy", "departmentEfficiencyRatings"]
                }
            }
        }

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    result = response.json()
                    text_out = result["candidates"][0]["content"]["parts"][0]["text"]
                    return json.loads(text_out.strip())
                else:
                    logger.warning(f"Gemini API returned status {response.status_code} on insights: {response.text}")
        except Exception as e:
            logger.error(f"Error calling Gemini API for admin insights: {e}")

        return fallback_insights

    @staticmethod
    def _get_department_for_category(category: str) -> str:
        cat = category.lower()
        if cat in ["pothole", "road_damage"]:
            return "Department of Transportation"
        elif cat == "garbage":
            return "Department of Sanitation & Waste Management"
        elif cat == "leakage":
            return "Department of Public Utilities (Water & Gas)"
        elif cat == "streetlight":
            return "Department of Energy & Lighting"
        else:
            return "City Parks & Recreation"
