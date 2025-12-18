from rest_framework import serializers
from .models import Product, Account, PackingSlip, File, Expense


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

    def validate_code(self, value):
        # Check if code exists for other records (excluding current instance during updates)
        instance = getattr(self, 'instance', None)
        if instance:
            if Product.objects.filter(code=value).exclude(id=instance.id).exists():
                raise serializers.ValidationError("Product with this code already exists.")
        else:
            if Product.objects.filter(code=value).exists():
                raise serializers.ValidationError("Product with this code already exists.")
        return value

    def validate_sku_buy_cost(self, value):
        if value < 0:
            raise serializers.ValidationError("Buy cost cannot be negative.")
        return value

    def validate_sku_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = '__all__'

    def validate_account_name(self, value):
        # Check if account_name exists for other records (excluding current instance during updates)
        instance = getattr(self, 'instance', None)
        if instance:
            if Account.objects.filter(account_name=value).exclude(id=instance.id).exists():
                raise serializers.ValidationError("Account with this name already exists.")
        else:
            if Account.objects.filter(account_name=value).exists():
                raise serializers.ValidationError("Account with this name already exists.")
        return value


class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ['id', 'packing_slip', 'file_type', 'file_path', 'page_number', 'created_at']


class PackingSlipSerializer(serializers.ModelSerializer):
    product_code = serializers.CharField(source='product.code', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    shipping_labels = serializers.SerializerMethodField()
    dst_files = serializers.SerializerMethodField()
    dgt_files = serializers.SerializerMethodField()
    # Make calculated fields read-only since they're auto-calculated
    platform_fee_calculated = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    profit = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = PackingSlip
        fields = ['id', 'ship_to', 'order_id', 'asin', 'product', 'product_code', 'product_name', 
                 'customizations', 'quantity', 'folder_path', 'status', 'shipping_labels', 'dst_files', 'dgt_files',
                 'sales_price', 'shipping_price', 'item_cost', 'shipping_cost', 
                 'platform_fee_percent', 'platform_fee_calculated', 'profit', 'tracking_ids',
                 'tracking_vendor', 'tracking_status',
                 'created_at', 'updated_at']
        extra_kwargs = {
            'product': {'required': False}  # Make product optional for updates since it shouldn't change
        }

    def get_shipping_labels(self, obj):
        """Get only shipping label files for this packing slip"""
        shipping_files = obj.files.filter(file_type='shipping_label')
        return FileSerializer(shipping_files, many=True).data
    
    def get_dst_files(self, obj):
        """Get only DST files for this packing slip"""
        dst_files = obj.files.filter(file_type='dst')
        return FileSerializer(dst_files, many=True).data
    
    def get_dgt_files(self, obj):
        """Get only DGT files for this packing slip"""
        dgt_files = obj.files.filter(file_type='dgt')
        return FileSerializer(dgt_files, many=True).data

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0.")
        return value

    def validate_sales_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Sales price cannot be negative.")
        return value

    def validate_shipping_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Shipping price cannot be negative.")
        return value

    def validate_item_cost(self, value):
        if value < 0:
            raise serializers.ValidationError("Item cost cannot be negative.")
        return value

    def validate_shipping_cost(self, value):
        if value < 0:
            raise serializers.ValidationError("Shipping cost cannot be negative.")
        return value

    def validate_platform_fee_percent(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Platform fee percent must be between 0 and 100.")
        return value


class ExpenseSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.account_name', read_only=True)
    expense_type_display = serializers.CharField(source='get_expense_type_display', read_only=True)
    
    class Meta:
        model = Expense
        fields = ['id', 'account', 'account_name', 'expense_type', 'expense_type_display', 
                 'date', 'amount', 'description', 'created_at', 'updated_at']
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0.")
        return value

