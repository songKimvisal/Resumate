from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str
    frontend_origin: str = "http://localhost:5173"
    gemini_api_key: str

    # AI provider switch: "gemini" (cloud, for production) or "ollama"
    # (free local AI on your own computer, for unlimited testing while
    # developing). Set AI_PROVIDER=ollama in your .env to switch.
    ai_provider: str = "gemini"
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
