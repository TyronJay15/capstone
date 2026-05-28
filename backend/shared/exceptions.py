from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        payload = {'success': False, 'errors': response.data}
        if isinstance(response.data, dict) and 'detail' in response.data:
            payload['detail'] = response.data['detail']
        response.data = payload
    return response
