import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface EmptyStateProps {
  text?: string;
  icon?: string;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ text = '暂无数据', icon = '📭', className }) => {
  return (
    <View className={classnames(styles.empty, className)}>
      <View className={styles.icon}>{icon}</View>
      <Text className={styles.text}>{text}</Text>
    </View>
  );
};

export default EmptyState;
