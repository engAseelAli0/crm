import React from 'react';
import styles from './UserAvatar.module.css';

const UserAvatar = ({ user, size = 40 }) => (
    <div
        className={styles.avatar}
        style={{
            width: size,
            height: size,
            fontSize: size * 0.5,
        }}
    >
        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
    </div>
);

export default UserAvatar;
