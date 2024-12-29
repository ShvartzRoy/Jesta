import re
from ninja import File
from ninja.files import UploadedFile
def password_check(passwd):
    SpecialSym =['$', '@', '#', '%']
    if len(passwd) < 6:
        print('length should be at least 6')
        return False
         
    if len(passwd) > 20:
        print('length should be not be greater than 8')
        return False
        
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
            return False
        return True

def check_name(name: str) -> bool:
    if len(name) < 3:
        return False
    if len(name) > 50:
        return False
    for char in name:
        if  not (("A" <= char and char <= "Z") or ("a" <= char and char <= "z") or (char == " ")):
            return False
    return True

def check_age(age: int) -> bool:
    if age < 15:
        return False
    if age > 150:
        return False
    return True

def check_image(image: UploadedFile = File(None)) -> bool:
    if not image.name.lower().endswith(('.png', '.jpg', '.jpeg')):
        return False
    return True

def check_resume(resume: UploadedFile = File(None)) -> bool:
    if not resume.name.lower().endswith('.pdf'):
        return False
    return True