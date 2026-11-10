import os
from pathlib import Path
from langgraph.checkpoint.memory import InMemorySaver
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from  dotenv import load_dotenv

load_dotenv()
SYSTEM_PROMT=Path("system_promt.md").read_text(encoding="utf-8")

model=ChatOpenAI(
    model="openai/gpt-6-luna",
    api_key=os.getenv("api_key"),
    base_url="https://api.aicredits.in/v1"
)

BABYGPT=create_agent(
    model=model,
    system_prompt= SYSTEM_PROMT,
    checkpointer=InMemorySaver()
    
    )

def agent_response(query:str)->str:
    thread_config={"configurable":{"thread_id":"1"}}
    reponse=BABYGPT.invoke({"messages": [{"role": "user", "content": query}]},thread_config,)
    return reponse["messages"][-1].content

if __name__ == "__main__":
    print(agent_response("Hey,whats the weather today"))