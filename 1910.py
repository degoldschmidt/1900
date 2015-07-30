import pygame, sys, os
from pygame.locals import *
pygame.init()
SW,SH = 640,480
screen = pygame.display.set_mode((SW,SH))
pygame.display.toggle_fullscreen()

bg = pygame.image.load(os.path.join("images/bg.jpg"))
semen = True


while 1:
    for event in pygame.event.get():
           if event.type == QUIT:
               return
           elif event.type == KEYDOWN:
               if event.key == K_ESCAPE:
                   pygame.quit()
                   return
    screen.blit(bg, (0,0))
    pygame.display.flip()       

pygame.quit()