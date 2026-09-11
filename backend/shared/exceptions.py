from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """Delegate to DRF's default handler.

    Error enveloping is applied uniformly by
    ``shared.renderers.EnvelopeJSONRenderer`` so we only need DRF to produce the
    raw error response/status here.
    """
    return exception_handler(exc, context)
