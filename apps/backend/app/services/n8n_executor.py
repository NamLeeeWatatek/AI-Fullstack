"""
N8N Integration Executor
Execute N8N webhook nodes
"""
from typing import Dict, Any
import aiohttp
import json


class N8NExecutor:
    """Execute N8N integration nodes"""
    
    # N8N endpoints configuration
    ENDPOINTS = {
        'n8n-video-generator': {
            'production': 'https://n8n.srv1078465.hstgr.cloud/webhook/wh-generate-video-ugc-ads-autopost-social',
            'test': 'https://watacorp.app.n8n.cloud/webhook/video-ads'
        },
        'n8n-seo-writer': {
            'production': 'https://n8n.srv1078465.hstgr.cloud/webhook/seo-writer',
            'test': 'https://watacorp.app.n8n.cloud/webhook/seo-writer-test'
        },
        'n8n-omnipost': {
            'production': 'https://n8n.srv1078465.hstgr.cloud/webhook/omnipost',
            'test': 'https://watacorp.app.n8n.cloud/webhook/omnipost-test'
        }
    }
    
    async def execute(
        self,
        node_type: str,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute N8N node"""
        
        # Get webhook URL
        webhook_url = self._get_webhook_url(node_type, config)
        
        if not webhook_url:
            return {'error': 'N8N webhook URL not configured'}
        
        # Prepare payload
        payload = self._prepare_payload(node_type, config)
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    webhook_url,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=300)  # 5 minutes
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return {
                            'executed': True,
                            'n8n_response': result,
                            'status': result.get('status'),
                            'message': result.get('message'),
                            'video_url': result.get('video_url'),
                            'facebook_post_id': result.get('facebook_post_id'),
                            'job_id': result.get('job_id')
                        }
                    else:
                        error_text = await response.text()
                        return {
                            'error': f'N8N webhook failed with status {response.status}',
                            'details': error_text
                        }
        except Exception as e:
            return {
                'error': 'Failed to call N8N webhook',
                'message': str(e)
            }
    
    def _get_webhook_url(self, node_type: str, config: Dict[str, Any]) -> str:
        """Get webhook URL based on node type and environment"""
        
        # Custom webhook
        if node_type == 'n8n-webhook':
            return config.get('webhook_url', '')
        
        # Predefined webhooks
        env = config.get('n8n_env', 'test')
        return self.ENDPOINTS.get(node_type, {}).get(env, '')
    
    def _prepare_payload(self, node_type: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare payload for N8N webhook"""
        
        if node_type == 'n8n-video-generator':
            return {
                'prompt': config.get('prompt', ''),
                'images': config.get('images', []),
                'platforms': config.get('platforms', [])
            }
        
        elif node_type == 'n8n-seo-writer':
            return {
                'topic': config.get('topic', ''),
                'keywords': config.get('keywords', []),
                'length': config.get('length', 'medium')
            }
        
        elif node_type == 'n8n-omnipost':
            return {
                'content': config.get('content', ''),
                'platforms': config.get('platforms', []),
                'schedule_time': config.get('schedule_time')
            }
        
        elif node_type == 'n8n-webhook':
            # Custom webhook - parse body from config
            try:
                return json.loads(config.get('body', '{}'))
            except:
                return {}
        
        return {}
