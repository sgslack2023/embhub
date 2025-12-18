# Generated migration to rename ShippingLabel to PackingSlip

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('masterdata', '0005_remove_shippinglabel_sku_shippinglabel_product'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='ShippingLabel',
            new_name='PackingSlip',
        ),
    ]