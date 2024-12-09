import { Button } from '@mui/material';
import { BsArrowUpRightSquareFill } from 'react-icons/bs'; 

const SubmitButton = ({ onClick, disabled, label = "Submit" }) => {
  return (
    <Button
      variant="contained"
      color="primary"
      onClick={onClick}
      disabled={disabled}
      sx={{
        display: 'flex',
        padding: '11px 33px',
        fontSize: '16px',
        color: 'white',
        background: '#6225e6',
        transition: '1s',
        boxShadow: '6px 6px 0 black',
        transform: 'skewX(-15deg)',
        border: 'none',
        cursor: 'pointer',
        '&:focus': {
          outline: 'none',
        },
        '&:hover': {
          transition: '0.5s',
          boxShadow: '10px 10px 0 #fbc638',
        },
        '&:hover .second': {
          marginRight: '45px',
        },
        '& .span': {
          transform: 'skewX(15deg)',
        },
        '& .second': {
          width: '10px',
          marginLeft: '30px',
          position: 'relative',
          top: '12%',
        },
        '& .one': {
          transition: '0.4s',
          transform: 'translateX(-60%)',
        },
        '& .two': {
          transition: '0.5s',
          transform: 'translateX(-30%)',
        },
        '&:hover .three': {
          animation: 'color_anim 1s infinite 0.2s',
        },
        '&:hover .one': {
          transform: 'translateX(0%)',
          animation: 'color_anim 1s infinite 0.6s',
        },
        '&:hover .two': {
          transform: 'translateX(0%)',
          animation: 'color_anim 1s infinite 0.4s',
        },
      }}
    >
      {label}
      <span className="span">
        <BsArrowUpRightSquareFill />
      </span>
      <span className="second"></span>
    </Button>
  );
};

export default SubmitButton;
