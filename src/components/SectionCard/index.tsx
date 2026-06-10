import React from 'react';
import { View } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface SectionCardProps {
  title?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, extra, children, footer, className }) => {
  return (
    <View className={classnames(styles.card, className)}>
      {(title || extra) && (
        <View className={styles.cardHeader}>
          {title && <View className={styles.title}>{title}</View>}
          {extra && <View className={styles.extra}>{extra}</View>}
        </View>
      )}
      <View className={styles.cardBody}>{children}</View>
      {footer && <View className={styles.cardFooter}>{footer}</View>}
    </View>
  );
};

export default SectionCard;
