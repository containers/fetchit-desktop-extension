import { Typography} from '@mui/material'
type DisplayProps = {
	text: string;
}

export default (props: DisplayProps) => {
	return (
      <Typography variant="body1"
				style={{
					color: "#f7f7f7"
				}}
				sx={{ mt: 2 }}
			>{props.text}</Typography>
	)
}