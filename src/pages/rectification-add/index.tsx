import React, { useState } from 'react';
import { View, Text, Input, Button, Image, Textarea, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useQualityStore } from '@/store/qualityStore';
import type { SourceType, LevelType } from '@/types/quality';
import { getSourceTypeText, getLevelText } from '@/utils/format';

const RectificationAddPage: React.FC = () => {
  const router = useRouter();
  const { addRectification } = useQualityStore();

  const [form, setForm] = useState({
    title: '',
    sourceType: 'process' as SourceType,
    batchNo: router.params.batchNo || '',
    level: 'medium' as LevelType,
    responsiblePerson: '',
    deadline: '',
    description: '',
    remark: ''
  });

  const [photos, setPhotos] = useState<string[]>([]);

  const handleInput = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const sourceOptions: { key: SourceType; label: string }[] = [
    { key: 'raw_material', label: '原料验收' },
    { key: 'process', label: '过程检查' },
    { key: 'finished', label: '成品抽检' },
    { key: 'customer', label: '客诉反馈' },
    { key: 'audit', label: '内审发现' }
  ];

  const levelOptions: { key: LevelType; label: string }[] = [
    { key: 'low', label: '一般' },
    { key: 'medium', label: '中等' },
    { key: 'high', label: '严重' },
    { key: 'critical', label: '紧急' }
  ];

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
        console.error('[RectificationAdd] 选择图片失败:', err);
        const mockPhotos = [
          'https://picsum.photos/id/119/300/300',
          'https://picsum.photos/id/160/300/300'
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
    if (!form.title.trim()) {
      Taro.showToast({ title: '请输入整改标题', icon: 'none' });
      return;
    }
    if (!form.batchNo.trim()) {
      Taro.showToast({ title: '请输入批次号', icon: 'none' });
      return;
    }
    if (!form.responsiblePerson.trim()) {
      Taro.showToast({ title: '请指定责任人', icon: 'none' });
      return;
    }
    if (!form.deadline.trim()) {
      Taro.showToast({ title: '请设置截止时间', icon: 'none' });
      return;
    }
    if (!form.description.trim()) {
      Taro.showToast({ title: '请描述问题内容', icon: 'none' });
      return;
    }

    addRectification({
      title: form.title.trim(),
      sourceType: form.sourceType,
      batchNo: form.batchNo.trim(),
      level: form.level,
      description: form.description.trim(),
      responsiblePerson: form.responsiblePerson.trim(),
      deadline: form.deadline,
      remark: form.remark,
      photos: photos
    });

    Taro.showToast({
      title: '创建成功',
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

  return (
    <View className={styles.page}>
      <ScrollView scrollY>
        <View className={styles.form}>
          <View className={styles.formSection}>
            <View className={styles.sectionTitle}>基本信息</View>

            <View className={styles.formItem}>
              <Text className={styles.label}>
                <Text className={styles.required}>*</Text>整改标题
              </Text>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.input}
                  placeholder="简要描述整改问题"
                  value={form.title}
                  onInput={(e) => handleInput('title', e.detail.value)}
                  maxlength={50}
                />
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.label}>问题来源</Text>
              <View className={styles.sourceOptions}>
                {sourceOptions.map(opt => (
                  <View
                    key={opt.key}
                    className={classnames(styles.sourceOption, form.sourceType === opt.key && styles.active)}
                    onClick={() => handleInput('sourceType', opt.key)}
                  >
                    {opt.label}
                  </View>
                ))}
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
              <Text className={styles.label}>严重等级</Text>
              <View className={styles.levelOptions}>
                {levelOptions.map(opt => (
                  <View
                    key={opt.key}
                    className={classnames(styles.levelOption, form.level === opt.key && styles.active, form.level === opt.key && styles[opt.key])}
                    onClick={() => handleInput('level', opt.key)}
                  >
                    {opt.label}
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View className={styles.formSection}>
            <View className={styles.sectionTitle}>责任与期限</View>

            <View className={styles.formItem}>
              <Text className={styles.label}>
                <Text className={styles.required}>*</Text>责任人
              </Text>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.input}
                  placeholder="请输入责任人姓名"
                  value={form.responsiblePerson}
                  onInput={(e) => handleInput('responsiblePerson', e.detail.value)}
                />
              </View>
            </View>

            <View className={styles.formItem}>
              <Text className={styles.label}>
                <Text className={styles.required}>*</Text>截止时间
              </Text>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.input}
                  placeholder="YYYY-MM-DD HH:mm"
                  value={form.deadline}
                  onInput={(e) => handleInput('deadline', e.detail.value)}
                />
              </View>
            </View>
          </View>

          <View className={styles.formSection}>
            <View className={styles.sectionTitle}>问题详情</View>

            <View className={styles.formItem} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <Text className={styles.label} style={{ marginBottom: 12 }}>
                <Text className={styles.required}>*</Text>问题描述
              </Text>
              <Textarea
                className={styles.textarea}
                placeholder="请详细描述问题内容..."
                value={form.description}
                onInput={(e) => handleInput('description', e.detail.value)}
                maxlength={500}
              />
            </View>

            <View className={styles.formItem} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <Text className={styles.label} style={{ marginBottom: 12 }}>现场照片</Text>
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

            <View className={styles.formItem} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <Text className={styles.label} style={{ marginBottom: 12 }}>备注说明</Text>
              <Textarea
                className={styles.textarea}
                placeholder="补充说明..."
                value={form.remark}
                onInput={(e) => handleInput('remark', e.detail.value)}
                maxlength={300}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View className={styles.footer}>
        <Button className={styles.cancelBtn} onClick={handleCancel}>取消</Button>
        <Button className={styles.submitBtn} onClick={handleSubmit}>创建整改单</Button>
      </View>
    </View>
  );
};

export default RectificationAddPage;
