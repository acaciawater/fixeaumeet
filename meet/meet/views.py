'''
Created on Mar 1, 2019

@author: theo
'''
from django.shortcuts import render
def mapview(request):
    return render(request, 'map.html')

def chartview(request,series):
    return render(request, 'chart.html',{'series':series})
