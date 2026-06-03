import PropTypes from 'prop-types';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

const MEDALS = ['🥇', '🥈', '🥉'];
const CHIP_COLORS = ['warning', 'default', 'default'];

// ==============================|| RANKING PROYECTOS TABLE ||============================== //

export default function RankingProyectosTable({ actas }) {
  if (!actas || actas.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary" variant="body2">
          Sin evaluaciones registradas aún
        </Typography>
      </Box>
    );
  }

  const ranking = [...actas]
    .filter((a) => a.notaFinal !== null && a.notaFinal !== undefined)
    .sort((a, b) => parseFloat(b.notaFinal) - parseFloat(a.notaFinal))
    .slice(0, 5);

  return (
    <Box>
      <TableContainer
        sx={{
          width: '100%',
          overflowX: 'auto',
          '& td, & th': { whiteSpace: 'nowrap' }
        }}
      >
        <Table size="small" aria-labelledby="rankingTable">
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 48 }}>#</TableCell>
              <TableCell>Proyecto</TableCell>
              <TableCell>Tribunal</TableCell>
              <TableCell align="right">Nota</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ranking.map((acta, idx) => {
              const tribunales = acta.detallesEvaluacion
                ?.map((d) => `${d.tribunal?.nombre ?? ''} ${d.tribunal?.apellido ?? ''}`.trim())
                .filter(Boolean)
                .join(', ') || '—';

              const nota = parseFloat(acta.notaFinal).toFixed(2);

              return (
                <TableRow
                  hover
                  key={acta.idActaEvaluacion}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell align="center">
                    {idx < 3 ? (
                      <Typography fontSize="1.2rem">{MEDALS[idx]}</Typography>
                    ) : (
                      <Chip
                        label={idx + 1}
                        size="small"
                        color={CHIP_COLORS[idx] || 'default'}
                        variant="outlined"
                        sx={{ minWidth: 28 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 220,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={acta.proyecto?.titulo}
                    >
                      {acta.proyecto?.titulo || `Acta #${acta.idActaEvaluacion}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ maxWidth: 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      title={tribunales}
                    >
                      {tribunales}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" sx={{ justifyContent: 'flex-end', alignItems: 'center', gap: 0.5 }}>
                      <Typography
                        variant="subtitle2"
                        color={parseFloat(nota) >= 70 ? 'success.main' : parseFloat(nota) >= 50 ? 'warning.main' : 'error.main'}
                        fontWeight={700}
                      >
                        {nota}
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

RankingProyectosTable.propTypes = {
  actas: PropTypes.array
};
