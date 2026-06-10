import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface InfoItemProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value, className }) => {
  return (
    <View className={classnames(styles.infoItem, className)}>
      <Text className={styles.label}>{label}</Text>
      <View className={styles.value}>{value}</View>
    </View>
  );
};

export default InfoItem;
