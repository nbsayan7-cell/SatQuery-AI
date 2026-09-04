from ai.models.vqa import VQAModel
from ai.models.captioning import CaptioningModel

class ModelRouter:
    @staticmethod
    async def route_query(image_path: str, query: str) -> dict:
        """
        Orchestrates intent classification and routes the query to the correct specialized agent.
        """
        lower_query = query.lower()
        
        # Intent classification heuristics
        captioning_keywords = ["describe", "summarize", "summary", "caption", "overview", "what is in this scene", "scene description"]
        
        if any(keyword in lower_query for keyword in captioning_keywords):
            # Route to Captioning Agent
            return await CaptioningModel.analyze(image_path, query)
        else:
            # Route to VQA Agent
            return await VQAModel.analyze(image_path, query)
