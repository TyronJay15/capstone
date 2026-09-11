"""Standardized API response envelope.

Every JSON response is wrapped as:

    {
        "success": bool,
        "message": str,
        "data": <payload or null>,
        "pagination": <object or null>,
        "errors": <object or null>
    }

Paginated DRF responses ({count, next, previous, results}) are split so the
list lives under ``data`` and the cursor metadata under ``pagination``.
"""
from rest_framework.renderers import JSONRenderer

_PAGINATION_KEYS = {'count', 'next', 'previous', 'results'}
_EXTRA_PAGE_KEYS = ('page', 'num_pages', 'page_size')


class EnvelopeJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        renderer_context = renderer_context or {}
        response = renderer_context.get('response')
        status_code = getattr(response, 'status_code', 200)

        # 204 No Content must not carry a body.
        if status_code == 204:
            return b''

        if status_code < 400:
            envelope = self._success_envelope(data)
        else:
            envelope = self._error_envelope(data)

        return super().render(envelope, accepted_media_type, renderer_context)

    @staticmethod
    def _success_envelope(data):
        payload = data
        pagination = None

        if isinstance(data, dict) and _PAGINATION_KEYS.issubset(data.keys()):
            payload = data.get('results')
            pagination = {
                'count': data.get('count'),
                'next': data.get('next'),
                'previous': data.get('previous'),
            }
            for key in _EXTRA_PAGE_KEYS:
                if key in data:
                    pagination[key] = data[key]

        return {
            'success': True,
            'message': '',
            'data': payload,
            'pagination': pagination,
            'errors': None,
        }

    @staticmethod
    def _error_envelope(data):
        message = 'Request failed.'
        if isinstance(data, dict):
            if isinstance(data.get('detail'), str):
                message = data['detail']
            elif isinstance(data.get('error'), str):
                message = data['error']
            elif isinstance(data.get('message'), str):
                message = data['message']
        elif isinstance(data, str):
            message = data

        return {
            'success': False,
            'message': message,
            'data': None,
            'pagination': None,
            'errors': data,
        }
