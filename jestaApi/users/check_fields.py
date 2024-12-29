import re
from ninja import File
from ninja.files import UploadedFile
from ninja.errors import *
def password_check(passwd):
    SpecialSym =['$', '@', '#', '%']
    if len(passwd) < 6:
        raise HttpError(400, "length should be at least 6")
        
         
    if len(passwd) > 20:
        raise HttpError(400, "length should be not be greater than 20")
        
    # when we are serious about password security

    # if not any(char.isdigit() for char in passwd):
    #     print('Password should have at least one numeral')
    #     return False
         
    # if not any(char.isupper() for char in passwd):
    #     print('Password should have at least one uppercase letter')
    #     return False
         
    # if not any(char.islower() for char in passwd):
    #     print('Password should have at least one lowercase letter')
    #     return False
         
    # if not any(char in SpecialSym for char in passwd):
    #     print('Password should have at least one of the symbols $@#')
    #     return False
    return True
    
def check_email(email: str) -> bool:
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            raise HttpError(400, "Invalid email")
        return True

def check_name(name: str) -> bool:
    if len(name) < 3:
        raise HttpError(400, "Name must be at least 3 characters")
    if len(name) > 50:
        raise HttpError(400, "Name must be at most 50 characters")
    for char in name:
        if  not (("A" <= char and char <= "Z") or ("a" <= char and char <= "z") or (char == " ")):
            raise HttpError(400, "Name must only contain letters and spaces")
    return True

def check_age(age: int) -> bool:
    if age < 15:
        raise HttpError(400, "You must be at least 15 in order to use Jesta")
    if age > 130:
        raise HttpError(400, "Wow, you're old! Please enter a valid age")
    return True

def check_image(image: UploadedFile = File(None)) -> bool:
    if not image.name.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise HttpError(415, "Invalid image format: must be png, jpg, or jpeg")
    # max 2MB
    if image.size > 2000000:
        raise HttpError(413, "Image too large: max 2MB")
    return True

def check_resume(resume: UploadedFile = File(None)) -> bool:
    if not resume.name.lower().endswith('.pdf'):
        raise HttpError(415, "Invalid file format: must be pdf")
    # max 2MB
    if resume.size > 2000000:
        raise HttpError(413, "File too large: max 2MB")
    return True