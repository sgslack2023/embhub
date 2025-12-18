from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EMBHubDriveAccountsView,
    EMBHubFolderTreeView,
    EMBHubCreateFolderView,
    EMBHubDeleteFolderView,
    EMBHubUploadFileView,
    EMBHubDeleteFileView,
    EMBHubListFolderContentsView,
    EMBHubSearchView,
    EMBHubRunAutomationView,
    ProductViewSet,
    AccountViewSet,
    ExpenseViewSet,
    PackingSlipsUploadView,
    PackingSlipsViewSet,
    ShippingLabelsUploadView,
    FileViewerView,
    DashboardKPIView,
    DashboardCustomerProfitAnalysisView,
    DashboardSKUAnalysisView,
    OrdersByStatusView,
    ProductAnalyticsView,
    PackingSlipPrintView,
    PackingSlipBulkPrintView,
    PackingSlipFetchTrackingStatusView,
    TrackingSchedulerView,
    TrackingUpdateView
)

router = DefaultRouter(trailing_slash=False)
router.register("products", ProductViewSet, 'products')
router.register("accounts", AccountViewSet, 'accounts')
router.register("expenses", ExpenseViewSet, 'expenses')
router.register("packing-slips", PackingSlipsViewSet, 'packing-slips')

urlpatterns = [
    # Product Management
    path("", include(router.urls)),
    
    # EMB HUB Google Drive Management
    path('emb-hub/accounts/', EMBHubDriveAccountsView.as_view(), name='emb-hub-accounts'),
    path('emb-hub/tree/', EMBHubFolderTreeView.as_view(), name='emb-hub-folder-tree'),
    path('emb-hub/folder/create/', EMBHubCreateFolderView.as_view(), name='emb-hub-create-folder'),
    path('emb-hub/folder/delete/', EMBHubDeleteFolderView.as_view(), name='emb-hub-delete-folder'),
    path('emb-hub/folder/contents/', EMBHubListFolderContentsView.as_view(), name='emb-hub-folder-contents'),
    path('emb-hub/file/upload/', EMBHubUploadFileView.as_view(), name='emb-hub-upload-file'),
    path('emb-hub/file/delete/', EMBHubDeleteFileView.as_view(), name='emb-hub-delete-file'),
    path('emb-hub/search/', EMBHubSearchView.as_view(), name='emb-hub-search'),
    path('emb-hub/run-automation/', EMBHubRunAutomationView.as_view(), name='emb-hub-run-automation'),
    
    # Packing Slips
    path('packing-slips/upload/', PackingSlipsUploadView.as_view(), name='packing-slips-upload'),
    path('packing-slips/<int:packing_slip_id>/print/', PackingSlipPrintView.as_view(), name='packing-slip-print'),
    path('packing-slips/bulk-print/', PackingSlipBulkPrintView.as_view(), name='packing-slip-bulk-print'),
    path('packing-slips/<int:packing_slip_id>/fetch-tracking-status/', PackingSlipFetchTrackingStatusView.as_view(), name='packing-slip-fetch-tracking-status'),
    
    # Shipping Labels
    path('shipping-labels/upload/', ShippingLabelsUploadView.as_view(), name='shipping-labels-upload'),
    
    # File Viewer
    path('file/<str:file_id>/', FileViewerView.as_view(), name='file-viewer'),
    
    # Dashboard KPIs
    path('dashboard/kpis/', DashboardKPIView.as_view(), name='dashboard-kpis'),
    path('dashboard/customer-profit-analysis/', DashboardCustomerProfitAnalysisView.as_view(), name='dashboard-customer-profit-analysis'),
    path('dashboard/sku-analysis/', DashboardSKUAnalysisView.as_view(), name='dashboard-sku-analysis'),
    
    # Orders
    path('orders/by-status/', OrdersByStatusView.as_view(), name='orders-by-status'),
    
    # Product Analytics
    path('product/analytics/', ProductAnalyticsView.as_view(), name='product-analytics'),

    # Tracking Service (Django Q2)
    path('tracking/scheduler/', TrackingSchedulerView.as_view(), name='tracking-scheduler'),
    path('tracking/update/', TrackingUpdateView.as_view(), name='tracking-update'),
] 