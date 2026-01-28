import { Close } from '@carbon/icons-react';
import { animate } from '@richaadgigi/stylexui';

interface AlertProps {
  id: string;
  type: 'success' | 'error';
  title: string;
  message: string;
}

export const Alert = ({ id, type, title, message }: AlertProps) => {
  return (
    <div
      className={`xui-alert xui-alert-${type} xui-bdr-rad-[8px]`}
      xui-anime={id}
      xui-anime-reverse="true"
      xui-anime-duration="3"
      xui-icon="false"
      xui-placed="top-right"
    >
      <div className="content">
        <p className="title">{title}</p>
        <span>{message}</span>
      </div>
      <div className="cancel" onClick={() => animate(id)}>
        <Close />
      </div>
    </div>
  );
};

export const showAlert = (id: string) => {
  animate(id);
};
