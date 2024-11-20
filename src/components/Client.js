import React, { useState, useEffect, useRef } from 'react';
import Avatar from 'react-avatar';

const Client = ({ username, socketRef, roomId }) => {
    
    return (
        <div className="client">
            <Avatar name={username} size={50} round="14px" />
            <span className="userName">{username}</span>
            
        </div>
    );
};

export default Client;
