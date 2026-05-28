from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class DomainStubView(APIView):
    """Placeholder until domain APIs are implemented."""

    permission_classes = [AllowAny]
    domain_name = 'unknown'

    def get(self, request):
        return Response(
            {
                'app': self.domain_name,
                'status': 'scaffolded',
                'detail': (
                    f'The {self.domain_name} API is registered. '
                    'Implement models, services, and endpoints in the next migration phase.'
                ),
            }
        )
