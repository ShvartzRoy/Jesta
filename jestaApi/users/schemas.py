from pydantic import BaseModel
from ninja import Schema

class SignInSchema(BaseModel):
    email: str
    password: str



class Error(Schema):
    error:str