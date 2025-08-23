from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from logging_config import logger

class GrowthService:
    @staticmethod
    async def get_user_skills(user_id: str) -> List[Dict[str, Any]]:
        """获取用户技能列表"""
        # 实际应用中应该查询数据库
        # 这里模拟获取用户技能数据
        return [
            {
                "id": "1",
                "name": "Python",
                "category": "编程语言",
                "level": 4,
                "progress": 85.5
            },
            {
                "id": "2",
                "name": "JavaScript",
                "category": "编程语言",
                "level": 3,
                "progress": 65.2
            },
            {
                "id": "3",
                "name": "React",
                "category": "前端框架",
                "level": 3,
                "progress": 70.8
            },
            {
                "id": "4",
                "name": "FastAPI",
                "category": "后端框架",
                "level": 2,
                "progress": 45.3
            },
            {
                "id": "5",
                "name": "数据库设计",
                "category": "数据库",
                "level": 3,
                "progress": 60.1
            }
        ]

    @staticmethod
    async def get_user_learning_paths(user_id: str) -> List[Dict[str, Any]]:
        """获取用户学习路径列表"""
        # 实际应用中应该查询数据库
        # 这里模拟获取用户学习路径数据
        return [
            {
                "id": "1",
                "name": "Python全栈开发",
                "description": "从基础到高级的Python全栈开发学习路径",
                "progress": 65.0,
                "modules": [
                    {"id": "m1", "name": "Python基础", "completed": True},
                    {"id": "m2", "name": "Web框架", "completed": True},
                    {"id": "m3", "name": "数据库", "completed": False},
                    {"id": "m4", "name": "高级应用", "completed": False}
                ]
            },
            {
                "id": "2",
                "name": "前端开发进阶",
                "description": "现代前端开发技术栈学习路径",
                "progress": 40.0,
                "modules": [
                    {"id": "fm1", "name": "JavaScript高级", "completed": True},
                    {"id": "fm2", "name": "React框架", "completed": True},
                    {"id": "fm3", "name": "状态管理", "completed": False},
                    {"id": "fm4", "name": "性能优化", "completed": False}
                ]
            }
        ]

    @staticmethod
    async def get_learning_path_details(user_id: str, path_id: str) -> Optional[Dict[str, Any]]:
        """获取学习路径详情"""
        # 实际应用中应该查询数据库
        # 这里模拟获取学习路径详情
        paths = await GrowthService.get_user_learning_paths(user_id)
        for path in paths:
            if path["id"] == path_id:
                # 丰富路径详情
                path["skills_covered"] = ["Python", "JavaScript", "React", "FastAPI", "数据库设计"]
                path["estimated_time"] = 40  # 预计小时数
                path["completed_challenges"] = 8
                path["total_challenges"] = 12
                return path
        return None

    @staticmethod
    async def get_user_challenges(user_id: str) -> List[Dict[str, Any]]:
        """获取用户挑战列表"""
        # 实际应用中应该查询数据库
        # 这里模拟获取用户挑战数据
        return [
            {
                "id": "1",
                "title": "Python基础语法挑战",
                "description": "测试你的Python基础语法知识",
                "difficulty": "简单",
                "skill_ids": ["1"],
                "completed": True
            },
            {
                "id": "2",
                "title": "JavaScript异步编程挑战",
                "description": "测试你的JavaScript异步编程能力",
                "difficulty": "中等",
                "skill_ids": ["2"],
                "completed": True
            },
            {
                "id": "3",
                "title": "React组件开发挑战",
                "description": "开发一个复杂的React组件",
                "difficulty": "中等",
                "skill_ids": ["3"],
                "completed": False
            },
            {
                "id": "4",
                "title": "FastAPI接口开发挑战",
                "description": "开发RESTful API接口",
                "difficulty": "困难",
                "skill_ids": ["4"],
                "completed": False
            }
        ]

    @staticmethod
    async def get_challenge_details(user_id: str, challenge_id: str) -> Optional[Dict[str, Any]]:
        """获取挑战详情"""
        # 实际应用中应该查询数据库
        # 这里模拟获取挑战详情
        challenges = await GrowthService.get_user_challenges(user_id)
        for challenge in challenges:
            if challenge["id"] == challenge_id:
                # 丰富挑战详情
                if challenge_id == "1":
                    challenge["questions"] = [
                        {
                            "id": "q1",
                            "text": "以下哪个不是Python的基本数据类型?",
                            "type": "multiple_choice",
                            "options": [
                                {"id": "a", "text": "int"},
                                {"id": "b", "text": "float"},
                                {"id": "c", "text": "double"},
                                {"id": "d", "text": "str"}
                            ],
                            "correct_answer": "c"
                        },
                        {
                            "id": "q2",
                            "text": "Python中用于异常处理的关键字是什么?",
                            "type": "multiple_choice",
                            "options": [
                                {"id": "a", "text": "try-catch"},
                                {"id": "b", "text": "try-except"},
                                {"id": "c", "text": "error-handle"},
                                {"id": "d", "text": "exception"}
                            ],
                            "correct_answer": "b"
                        }
                    ]
                elif challenge_id == "4":
                    challenge["questions"] = [
                        {
                            "id": "q1",
                            "text": "使用FastAPI开发一个GET接口，返回当前时间",
                            "type": "coding",
                            "requirements": [
                                "使用Python的datetime模块获取当前时间",
                                "接口路径为/time",
                                "返回格式为JSON，包含timestamp和formatted_time字段"
                            ],
                            "template_code": "from fastapi import FastAPI\nimport datetime\n\napp = FastAPI()\n\n@app.get('/time')\nasync def get_current_time():\n    # 在这里实现代码\n    pass"
                        }
                    ]
                return challenge
        return None

    @staticmethod
    async def complete_challenge(user_id: str, challenge_id: str) -> Optional[List[Dict[str, Any]]]:
        """完成挑战并更新技能等级"""
        # 实际应用中应该更新数据库
        # 这里模拟完成挑战并返回技能更新情况
        logger.info(f"用户 {user_id} 完成挑战 {challenge_id}")

        # 获取挑战详情
        challenge = await GrowthService.get_challenge_details(user_id, challenge_id)
        if not challenge:
            return None

        # 模拟更新相关技能
        skill_updates = []
        for skill_id in challenge["skill_ids"]:
            # 这里简单地为每个相关技能增加一些经验值
            skill_updates.append({
                "skill_id": skill_id,
                "old_level": 3,
                "new_level": 4,
                "old_progress": 75.0,
                "new_progress": 90.0
            })

        return skill_updates