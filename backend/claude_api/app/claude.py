from typing import List, Optional
import anthropic
import os
from pydantic import BaseModel

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    project_id: int
    file_ids: Optional[List[int]] = None

class ChatResponse(BaseModel):
    message: Message

async def get_claude_response(messages: List[Message], context: str = "") -> str:
    try:
        async with anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY")) as client:
            # Prepare system prompt with context
            system_prompt = "You are Claude, an AI assistant. "
            if context:
                system_prompt += f"\nContext: {context}"
            
            # Convert messages to Anthropic format
            conversation = []
            for msg in messages:
                conversation.append({
                    "role": msg.role,
                    "content": msg.content
                })
            
            # Log API key presence (not the actual key)
            print(f"API Key present: {bool(os.getenv('ANTHROPIC_API_KEY'))}")
            
            response = await client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=1024,
                messages=conversation,
                system=system_prompt
            )
            return response.content[0].text
    except Exception as e:
        print(f"Detailed error: {str(e)}")
        raise Exception(f"Error calling Claude API: {str(e)}")
