"""MCP servers configuration: will be replaced by models."""

from django.conf import settings
from pydantic_ai.mcp import MCPServerStreamableHTTP


def get_mcp_servers(user=None):
    """Retrieve MCP servers configuration."""
    servers = []

    # Configure huwise (Data Education) MCP server if API key is provided
    api_key = None
    if user and hasattr(user, "data_education_api_key") and user.data_education_api_key:
        api_key = user.data_education_api_key
    elif hasattr(settings, "DATA_EDUCATION_API_KEY") and settings.DATA_EDUCATION_API_KEY:
        api_key = settings.DATA_EDUCATION_API_KEY

    if api_key:
        servers.append(
            MCPServerStreamableHTTP(
                url="https://mcp.huwise.com/mcp",
                headers={
                    "x-domain": "https://data.education.gouv.fr",
                    "x-apikey": api_key,
                }
            )
        )

    return servers
