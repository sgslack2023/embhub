# Generated migration to add folder_path field to PackingSlip

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('masterdata', '0006_rename_shippinglabel_packingslip'),
    ]

    operations = [
        migrations.AddField(
            model_name='packingslip',
            name='folder_path',
            field=models.CharField(blank=True, default='', max_length=500),
        ),
    ]
