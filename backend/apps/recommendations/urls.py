from django.urls import path

from .views import (
    GenerateRecommendationView,
    LatestRecommendationView,
    RecommendationHistoryView,
    RecommendationSummaryView,
)

urlpatterns = [
    path('me/', LatestRecommendationView.as_view(), name='recommendation-latest'),
    path('generate/', GenerateRecommendationView.as_view(), name='recommendation-generate'),
    path('history/', RecommendationHistoryView.as_view(), name='recommendation-history'),
    path('summary/', RecommendationSummaryView.as_view(), name='recommendation-summary'),
]
