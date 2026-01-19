from django.contrib import admin
from .models import Product, Account

# Register your models here.

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'sku_uom', 'sku_buy_cost', 'sku_price', 'color', 'created_at')
    list_filter = ('sku_uom', 'color', 'created_at')
    search_fields = ('name', 'code', 'sku_description')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('name',)


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('account_name', 'active', 'created_at', 'updated_at')
    list_filter = ('active', 'created_at')
    search_fields = ('account_name',)
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('account_name',)
