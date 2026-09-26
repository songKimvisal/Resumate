from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    frontend_origin: str = "http://localhost:5173"
    gemini_api_key: str
    ai_provider: str = "gemini"
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1"

    bakong_token: str = ""
    bakong_account_id: str = ""
    bakong_merchant_name: str = ""
    bakong_merchant_city: str = "Phnom Penh"
    bakong_proxy_url: str = ""

    payway_merchant_id: str = ""
    payway_api_key: str = ""
    payway_api_url: str = "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase"
    # Public URL for PayWay callbacks; its domain must be whitelisted by PayWay.
    backend_public_url: str = ""
    # Turn on once ABA enables Credentials on File for the merchant.
    payway_saved_cards_enabled: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
