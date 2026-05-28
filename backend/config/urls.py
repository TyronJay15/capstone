from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView

from apps.authentication.views import HealthCheckView

API_V1 = 'api/v1/'

urlpatterns = [
    path('', RedirectView.as_view(url=f'{API_V1}health/', permanent=False), name='root'),
    path('admin/', admin.site.urls),
    path(f'{API_V1}health/', HealthCheckView.as_view(), name='health'),
    path(f'{API_V1}auth/', include('apps.authentication.urls')),
    path(f'{API_V1}students/', include('apps.students.urls')),
    path(f'{API_V1}parents/', include('apps.parents.urls')),
    path(f'{API_V1}teachers/', include('apps.teachers.urls')),
    path(f'{API_V1}enrollment/', include('apps.enrollment.urls')),
    path(f'{API_V1}academics/', include('apps.academics.urls')),
    path(f'{API_V1}recommendations/', include('apps.recommendations.urls')),
    path(f'{API_V1}forecasting/', include('apps.forecasting.urls')),
    path(f'{API_V1}chatbot/', include('apps.chatbot.urls')),
    path(f'{API_V1}reports/', include('apps.reports.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
