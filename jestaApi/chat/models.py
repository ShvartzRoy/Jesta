from django.db import models
from django.conf import settings

class Conversation(models.Model):
    # For a one-to-one chat, store the two participants.
    # (You can enforce ordering or a unique-together constraint to avoid duplicates.)
    participant1 = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='conversations_as_participant1'
    )
    participant2 = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='conversations_as_participant2'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('participant1', 'participant2')

    def __str__(self):
        return f"Conversation between {self.participant1} and {self.participant2}"

class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name='messages'
    )
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('timestamp',)

    def __str__(self):
        return f"{self.sender}: {self.content[:20]}"
