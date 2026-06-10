import React, { useState } from 'react';
import { View, Text, Input, Button, Image, Textarea, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useQualityStore } from '@/store/qualityStore';
import type { InspectionStatus } from '@/types/quality';

const AcceptanceAddPage: React.FC = () => {
  const router = useRouter();
  const { addAcceptance } = useQualityStore();

  const [form, setForm] = useState({
    batchNo: router.params.batchNo || '',
    materialName: '',
    materialSpec: '',
    supplier: '',
    arrivalTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
    arrivalTemp: '',
    quantity: '',
    unit: 'kg',
    inspector: '张质检',
    conclusion: 'qualified' as InspectionStatus,
    remark: ''
  });

  const [photos, setPhotos] = useState<string[]>([]);

  const handleInput = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleConclusionChange = (conclusion: InspectionStatus) => {
    setForm(prev => ({ ...prev, conclusion }));
  };

  const handleAddPhoto = () => {
    Taro.chooseImage({
      count: 9 - photos.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newPhotos = res.tempFilePaths || [];
        setPhotos(prev => [...prev, ...newPhotos].slice(0, 9));
      },
      fail: (err) => {
        console.error('[AcceptanceAdd] 选择图片失败:', err);
        const mockPhotos = [
          'https://picsum.photos/id/292/300/300',
          'https://picsum.photos/id/312/300/300'
        ];
        setPhotos(prev => [...prev, ...mockPhotos].slice(0, 9));
        Taro.showToast({ title: '已添加模拟图片', icon: 'none' });
      }
    });
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!form.materialName.trim()) {
      Taro.showToast({ title: '请输入原料名称', icon: 'none' });
      return;
    }
    if (!form.batchNo.trim()) {
      Taro.showToast({ title: '请输入批次号', icon: 'none' });
      return;
    }
    if (!form.supplier.trim()) {
      Taro.showToast({ title: '请输入供应商', icon: 'none' });
      return;
    }

    const quantityNum = parseFloat(form.quantity) || 0;
    const tempNum = parseFloat(form.arrivalTemp) || 0;

    addAcceptance({
      batchNo: form.batchNo.trim(),
      materialName: form.materialName.trim(),
      materialSpec: form.materialSpec.trim() || '标准规格',
      supplier: form.supplier.trim(),
      arrivalTime: form.arrivalTime,
      arrivalTemp: tempNum,
      quantity: quantityNum,
      unit: form.unit,
      inspector: form.inspector,
      conclusion: form.conclusion,
      remark: form.remark,
      photos: photos
    });

    Taro.showToast({
      title: '提交成功',
      icon: 'success',
      duration: 1500
    });

    setTimeout(() => {
      Taro.navigateBack();
    }, 1500);
  };

  const handleCancel = () => {
    Taro.navigateBack();
  };

  const conclusionOptions = [
    { key: 'qualified' as InspectionStatus, label: '合格', className: 'qualified' },
    { key: 'unqualified' as InspectionStatus, label: '不合格', className: 'unqualified' },
    { key: 'recheck' as InspectionStatus, label: '待复检', className: 'recheck' }
  ];

  return (
    <View className={styles.page}>
      <ScrollView scrollY>
        <View className={styles.form}>
          <View className={styles.formSection}>
            <View className={styles.sectionTitle}>基础信息</View>

            <View className={styles.formItem}>
              <Text className={styles.label}>
                <Text className={styles.required}>*</Text>原料名称
              </Text>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.input}
                  placeholder="请输入原料名称"
                  value={form.materialName}
                  onInput={(e) => handleInput('materialName', e.detail.value)}
                />
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.label}>
                <Text className={styles.required}>*</Text>批次号
              </Text>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.input}
                  placeholder="请输入批次号"
                  value={form.batchNo}
                  onInput={(e) => handleInput('batchNo', e.detail.value)}
                />
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.label}>规格型号</Text>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.input}
                  placeholder="如：25kg/袋"
                  value={form.materialSpec}
                  onInput={(e) => handleInput('materialSpec', e.detail.value)}
                />
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.label}>
                <Text className={styles.required}>*</Text>供应商
              </Text>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.input}
                  placeholder="请输入供应商名称"
                  value={form.supplier}
                  onInput={(e) => handleInput('supplier', e.detail.value)}
                />
              </View>
            </View>
          </View>

          <View className={styles.formSection}>
            <View className={styles.sectionTitle}>到货信息</View>

            <View className={styles.formItem}>
              <Text className={styles.label}>到货时间</Text>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.input}
                  placeholder="YYYY-MM-DD HH:mm"
                  value={form.arrivalTime}
                  onInput={(e) => handleInput('arrivalTime', e.detail.value)}
                />
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.label}>到货温度</Text>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.input}
                  type="digit"
                  placeholder="请输入温度"
                  value={form.arrivalTemp}
                  onInput={(e) => handleInput('arrivalTemp', e.detail.value)}
                />
                <Text className={styles.unit}>℃</Text>
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.label}>数量</Text>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.input}
                  type="digit"
                  placeholder="请输入数量"
                  value={form.quantity}
                  onInput={(e) => handleInput('quantity', e.detail.value)}
                />
                <Text className={styles.unit}>{form.unit}</Text>
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.label}>单位</Text>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.input}
                  placeholder="如：kg、袋、桶"
                  value={form.unit}
                  onInput={(e) => handleInput('unit', e.detail.value)}
                />
              </View>
            </View>
          </View>

          <View className={styles.formSection}>
            <View className={styles.sectionTitle}>检验信息</View>

            <View className={styles.formItem}>
              <Text className={styles.label}>检验员</Text>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.input}
                  placeholder="请输入检验员姓名"
                  value={form.inspector}
                  onInput={(e) => handleInput('inspector', e.detail.value)}
                />
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.label}>检验结论</Text>
              <View className={styles.conclusionRow}>
                {conclusionOptions.map(opt => (
                  <View
                    key={opt.key}
                    className={classnames(
                      styles.conclusionOption,
                      form.conclusion === opt.key && styles.active,
                      form.conclusion === opt.key && styles[opt.className]
                    )}
                    onClick={() => handleConclusionChange(opt.key)}
                  >
                    {opt.label}
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formItem} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <Text className={styles.label} style={{ marginBottom: 12 }}>备注说明</Text>
              <Textarea
                className={styles.textarea}
                placeholder="请输入检验备注说明..."
                value={form.remark}
                onInput={(e) => handleInput('remark', e.detail.value)}
                maxlength={500}
              />
            </View>
          </View>

          <View className={styles.formSection}>
            <View className={styles.sectionTitle}>验收照片</View>
            <View className={styles.photoGrid}>
              {photos.map((photo, index) => (
                <View key={index} className={styles.photoItem}>
                  <Image src={photo} mode="aspectFill" />
                  <View className={styles.removeBtn} onClick={() => handleRemovePhoto(index)}>×</View>
                </View>
              ))}
              {photos.length < 9 && (
                <View className={styles.addPhotoBtn} onClick={handleAddPhoto}>
                  <Text className={styles.icon}>+</Text>
                  <Text>添加照片</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <View className={styles.footer}>
        <Button className={styles.cancelBtn} onClick={handleCancel}>取消</Button>
        <Button className={styles.submitBtn} onClick={handleSubmit}>提交验收</Button>
      </View>
    </View>
  );
};

export default AcceptanceAddPage;
