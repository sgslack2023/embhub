from django.db import models

# Create your models here.

class Product(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=255, unique=True)
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    sku_description = models.TextField()
    sku_uom = models.CharField(max_length=255)
    sku_buy_cost = models.DecimalField(max_digits=10, decimal_places=2)
    sku_price = models.DecimalField(max_digits=10, decimal_places=2)
    color = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("name",)

    def __str__(self):
        return f"{self.name} ({self.code})"


class Account(models.Model):
    account_name = models.CharField(max_length=255)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("account_name",)

    def __str__(self):
        return self.account_name


class PackingSlip(models.Model):
    STATUS_CHOICES = [
        ('new_order', 'New Order'),
        ('digitizing', 'Digitizing'),
        ('ready_for_production', 'Ready For Production'),
        ('in_production', 'In Production'),
        ('quality_check', 'Quality Check'),
        ('ready_to_ship', 'Ready to Ship'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
    ]
    
    TRACKING_VENDOR_CHOICES = [
        ('fedex', 'FedEx'),
        ('ups', 'UPS'),
        ('usps', 'USPS'),
    ]
    
    ship_to = models.TextField(blank=True, default='')  # Store full shipping address (optional)
    order_id = models.CharField(max_length=255)
    asin = models.CharField(max_length=255)
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='packing_slips')
    customizations = models.TextField(blank=True, default='')  # Store all customization details
    quantity = models.IntegerField()
    folder_path = models.CharField(max_length=500, blank=True, default='')  # Store folder path where file was uploaded
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='new_order')
    
    # New financial fields
    sales_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    shipping_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    item_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    platform_fee_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)  # e.g., 15.00 for 15%
    platform_fee_calculated = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    profit = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tracking_ids = models.TextField(blank=True, default='')  # Store tracking IDs (comma-separated or JSON)
    
    # New tracking fields
    tracking_vendor = models.CharField(max_length=10, choices=TRACKING_VENDOR_CHOICES, blank=True, default='')
    tracking_status = models.CharField(max_length=100, blank=True, default='')  # Current tracking status
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"Order {self.order_id} - {self.product.code}"
    
    def save(self, *args, **kwargs):
        """Override save method to auto-populate item_cost, sales_price and calculate fields"""
        # Auto-populate item_cost and sales_price from product if not already set
        if self.product:
            if not self.item_cost or self.item_cost == 0:
                self.item_cost = self.product.sku_buy_cost
            if not self.sales_price or self.sales_price == 0:
                self.sales_price = self.product.sku_price
        
        # Calculate platform fee
        self.calculate_platform_fee()
        
        # Calculate profit
        self.calculate_profit()
        
        super().save(*args, **kwargs)
    
    def calculate_platform_fee(self):
        """Calculate platform fee based on sales price and percentage"""
        if self.sales_price and self.platform_fee_percent:
            self.platform_fee_calculated = (self.sales_price * self.platform_fee_percent) / 100
        else:
            self.platform_fee_calculated = 0.00
    
    def calculate_profit(self):
        """Calculate profit: sales_price + shipping_price - item_cost - shipping_cost - platform_fee_calculated"""
        total_revenue = (self.sales_price or 0) + (self.shipping_price or 0)
        total_costs = (self.item_cost or 0) + (self.shipping_cost or 0) + (self.platform_fee_calculated or 0)
        self.profit = total_revenue - total_costs


class File(models.Model):
    FILE_TYPES = [
        ('packing_slip', 'Packing Slip'),
        ('shipping_label', 'Shipping Label'),
        ('dst', 'DST File'),
        ('dgt', 'DGT File'),
    ]
    
    packing_slip = models.ForeignKey(PackingSlip, on_delete=models.CASCADE, related_name='files')
    file_type = models.CharField(max_length=20, choices=FILE_TYPES)
    file_path = models.CharField(max_length=1000)  # Google Drive file link
    page_number = models.IntegerField(null=True, blank=True)  # Page number for shipping labels
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        page_info = f" (Page {self.page_number})" if self.page_number else ""
        return f"{self.get_file_type_display()} - {self.file_path}{page_info}"


class Expense(models.Model):
    EXPENSE_TYPE_CHOICES = [
        ('shipping', 'Shipping'),
        ('materials', 'Materials'),
        ('labor', 'Labor'),
        ('utilities', 'Utilities'),
        ('rent', 'Rent'),
        ('marketing', 'Marketing'),
        ('software', 'Software'),
        ('supplies', 'Supplies'),
        ('maintenance', 'Maintenance'),
        ('other', 'Other'),
    ]
    
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='expenses')
    expense_type = models.CharField(max_length=50, choices=EXPENSE_TYPE_CHOICES)
    date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-date", "-created_at")

    def __str__(self):
        return f"{self.account.account_name} - {self.get_expense_type_display()} - ${self.amount}"
