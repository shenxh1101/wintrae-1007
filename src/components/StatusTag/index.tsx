import React from 'react';
import { View } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

export type TagType = 'success' | 'warning' | 'error' | 'info' | 'primary' | 'purple' | 'gray';

interface StatusTagProps {
  text: string;
  type: TagType;
  className?: string;
}

const StatusTag: React.FC<StatusTagProps> = ({ text, type, className }) => {
  return (
    <View className={classnames(styles.tag, styles[type], className)}>
      {text}
    </View>
  );
};

export default StatusTag;
