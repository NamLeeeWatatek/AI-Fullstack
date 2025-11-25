"""
N8N Flow Templates
Pre-configured workflow templates for N8N integrations
"""

N8N_FLOW_TEMPLATES = {
    "video-ads-generator": {
        "name": "Video Ads Generator (N8N)",
        "description": "Tự động tạo video quảng cáo và đăng lên mạng xã hội",
        "category": "n8n",
        "thumbnail": "🎬",
        "nodes": [
            {
                "id": "trigger-1",
                "type": "custom",
                "position": {"x": 100, "y": 200},
                "data": {
                    "label": "Manual Trigger",
                    "type": "trigger-message",
                    "config": {}
                }
            },
            {
                "id": "n8n-video-1",
                "type": "custom",
                "position": {"x": 400, "y": 200},
                "data": {
                    "label": "Generate Video",
                    "type": "n8n-video-generator",
                    "config": {
                        "prompt": "Tạo video 15 giây giới thiệu sản phẩm với ánh sáng tự nhiên, phong cách chuyên nghiệp",
                        "images": [],
                        "platforms": ["facebook"],
                        "n8n_env": "test"
                    }
                }
            }
        ],
        "edges": [
            {
                "id": "e1-2",
                "source": "trigger-1",
                "target": "n8n-video-1",
                "type": "default"
            }
        ]
    },
    
    "seo-content-writer": {
        "name": "SEO Content Writer (N8N)",
        "description": "Tự động viết bài chuẩn SEO và đăng lên website",
        "category": "n8n",
        "thumbnail": "📝",
        "nodes": [
            {
                "id": "trigger-1",
                "type": "custom",
                "position": {"x": 100, "y": 200},
                "data": {
                    "label": "Manual Trigger",
                    "type": "trigger-message",
                    "config": {}
                }
            },
            {
                "id": "n8n-seo-1",
                "type": "custom",
                "position": {"x": 400, "y": 200},
                "data": {
                    "label": "Write SEO Content",
                    "type": "n8n-seo-writer",
                    "config": {
                        "topic": "",
                        "keywords": [],
                        "length": "medium",
                        "n8n_env": "test"
                    }
                }
            }
        ],
        "edges": [
            {
                "id": "e1-2",
                "source": "trigger-1",
                "target": "n8n-seo-1",
                "type": "default"
            }
        ]
    },
    
    "omnipost-social": {
        "name": "OmniPost Social (N8N)",
        "description": "Đăng nội dung lên nhiều mạng xã hội cùng lúc",
        "category": "n8n",
        "thumbnail": "📢",
        "nodes": [
            {
                "id": "trigger-1",
                "type": "custom",
                "position": {"x": 100, "y": 200},
                "data": {
                    "label": "Manual Trigger",
                    "type": "trigger-message",
                    "config": {}
                }
            },
            {
                "id": "n8n-omni-1",
                "type": "custom",
                "position": {"x": 400, "y": 200},
                "data": {
                    "label": "Post to Social",
                    "type": "n8n-omnipost",
                    "config": {
                        "content": "",
                        "platforms": ["facebook", "instagram"],
                        "n8n_env": "test"
                    }
                }
            }
        ],
        "edges": [
            {
                "id": "e1-2",
                "source": "trigger-1",
                "target": "n8n-omni-1",
                "type": "default"
            }
        ]
    },
    
    "complete-video-workflow": {
        "name": "Complete Video Workflow (N8N)",
        "description": "Workflow đầy đủ: Tạo video → AI optimize → Post social",
        "category": "n8n",
        "thumbnail": "🎯",
        "nodes": [
            {
                "id": "trigger-1",
                "type": "custom",
                "position": {"x": 100, "y": 250},
                "data": {
                    "label": "Start",
                    "type": "trigger-message",
                    "config": {}
                }
            },
            {
                "id": "n8n-video-1",
                "type": "custom",
                "position": {"x": 350, "y": 250},
                "data": {
                    "label": "Generate Video",
                    "type": "n8n-video-generator",
                    "config": {
                        "prompt": "Tạo video quảng cáo sản phẩm 15 giây",
                        "images": [],
                        "platforms": ["facebook"],
                        "n8n_env": "test"
                    }
                }
            },
            {
                "id": "ai-1",
                "type": "custom",
                "position": {"x": 600, "y": 150},
                "data": {
                    "label": "AI Optimize Caption",
                    "type": "ai-gemini",
                    "config": {
                        "prompt": "Viết caption hấp dẫn cho video quảng cáo này",
                        "model": "gemini-pro"
                    }
                }
            },
            {
                "id": "send-fb-1",
                "type": "custom",
                "position": {"x": 850, "y": 250},
                "data": {
                    "label": "Post to Facebook",
                    "type": "send-facebook",
                    "config": {
                        "message": "{ai_response}",
                        "channel_id": None
                    }
                }
            }
        ],
        "edges": [
            {
                "id": "e1-2",
                "source": "trigger-1",
                "target": "n8n-video-1",
                "type": "default"
            },
            {
                "id": "e2-3",
                "source": "n8n-video-1",
                "target": "ai-1",
                "type": "default"
            },
            {
                "id": "e3-4",
                "source": "ai-1",
                "target": "send-fb-1",
                "type": "default"
            }
        ]
    }
}


def get_n8n_templates():
    """Get all N8N templates"""
    return [
        {
            "id": key,
            "name": template["name"],
            "description": template["description"],
            "category": template["category"],
            "thumbnail": template["thumbnail"]
        }
        for key, template in N8N_FLOW_TEMPLATES.items()
    ]


def get_n8n_template_by_id(template_id: str):
    """Get specific N8N template with full workflow data"""
    return N8N_FLOW_TEMPLATES.get(template_id)
