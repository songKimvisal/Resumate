from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    frontend_origin: str = "http://localhost:5173"
    gemini_api_key: str
    ai_provider: str = "gemini"
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
