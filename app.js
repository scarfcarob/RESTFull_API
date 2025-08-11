
import express from 'express';

const app = express();
const PUERTO = 8080;

app.use(express.json());

// Datos en memoria (ejemplo)
let usuarios = [
  { id: 1, nombre: 'Alice', email: 'alice@example.com' },
  { id: 2, nombre: 'Bob', email: 'bob@example.com' }
];
let libros = [
  { id: 1, titulo: '1984', autor: 'George Orwell', existencia: 3 },
  { id: 2, titulo: 'Clean Code', autor: 'Robert C. Martin', existencia: 1 },
  { id: 3, titulo: 'Libro vacío', autor: 'Nadie', existencia: 0 }
];
let prestamos = [
  { id: 1, id_usuario: 1, id_libro: 2, fecha_prestamo: '2025-08-01', fecha_devolucion: null },
];
let resenias = [
  { id: 1, id_libro: 1, id_usuario: 2, puntuacion: 5, comentario: 'Excelente libro' }
];

const siguienteId = (arr) => (arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1);

// --- Usuarios ---
app.get('/usuarios', (req, res) => res.json(usuarios));

app.get('/usuarios/:id', (req, res) => {
  const id = Number(req.params.id);
  const usuario = usuarios.find(u => u.id === id);
  if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  res.json(usuario);
});

app.post('/usuarios', (req, res) => {
  const { nombre, email } = req.body;
  if (!nombre || !email) return res.status(400).json({ mensaje: 'nombre y email son requeridos' });
  const usuario = { id: siguienteId(usuarios), nombre, email };
  usuarios.push(usuario);
  res.status(201).json(usuario);
});

app.put('/usuarios/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = usuarios.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  usuarios[idx] = { ...usuarios[idx], ...req.body };
  res.json(usuarios[idx]);
});

app.delete('/usuarios/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = usuarios.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  const eliminado = usuarios.splice(idx, 1)[0];
  res.json({ mensaje: 'Eliminado', eliminado });
});

// --- Libros ---
app.get('/libros', (req, res) => res.json(libros));

app.get('/libros/:id', (req, res) => {
  const id = Number(req.params.id);
  const libro = libros.find(b => b.id === id);
  if (!libro) return res.status(404).json({ mensaje: 'Libro no encontrado' });
  res.json(libro);
});

app.post('/libros', (req, res) => {
  const { titulo, autor, existencia = 0 } = req.body;
  if (!titulo || !autor) return res.status(400).json({ mensaje: 'titulo y autor son requeridos' });
  const libro = { id: siguienteId(libros), titulo, autor, existencia: Number(existencia) };
  libros.push(libro);
  res.status(201).json(libro);
});

app.put('/libros/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = libros.findIndex(b => b.id === id);
  if (idx === -1) return res.status(404).json({ mensaje: 'Libro no encontrado' });
  libros[idx] = { ...libros[idx], ...req.body };
  if (libros[idx].existencia !== undefined) libros[idx].existencia = Number(libros[idx].existencia);
  res.json(libros[idx]);
});

app.put('/libros/:id/existencia', (req, res) => {
  const id = Number(req.params.id);
  const { existencia } = req.body;
  if (existencia === undefined) return res.status(400).json({ mensaje: 'existencia es requerida' });
  const libro = libros.find(b => b.id === id);
  if (!libro) return res.status(404).json({ mensaje: 'Libro no encontrado' });
  libro.existencia = Number(existencia);
  res.json(libro);
});

app.delete('/libros/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = libros.findIndex(b => b.id === id);
  if (idx === -1) return res.status(404).json({ mensaje: 'Libro no encontrado' });
  const eliminado = libros.splice(idx, 1)[0];
  res.json({ mensaje: 'Eliminado', eliminado });
});

// --- Prestamos ---
app.get('/prestamos', (req, res) => res.json(prestamos));

app.get('/prestamos/:id', (req, res) => {
  const id = Number(req.params.id);
  const p = prestamos.find(x => x.id === id);
  if (!p) return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
  res.json(p);
});

app.post('/prestamos', (req, res) => {
  const { id_usuario, id_libro, fecha_prestamo = new Date().toISOString().slice(0,10), fecha_devolucion = null } = req.body;
  if (!id_usuario || !id_libro) return res.status(400).json({ mensaje: 'id_usuario e id_libro son requeridos' });

  const libro = libros.find(b => b.id === Number(id_libro));
  if (!libro) return res.status(404).json({ mensaje: 'Libro no encontrado' });
  if (libro.existencia <= 0) return res.status(400).json({ mensaje: 'Libro no disponible' });

  libro.existencia -= 1;

  const prestamo = { id: siguienteId(prestamos), id_usuario: Number(id_usuario), id_libro: Number(id_libro), fecha_prestamo, fecha_devolucion };
  prestamos.push(prestamo);
  res.status(201).json(prestamo);
});

app.put('/prestamos/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = prestamos.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
  const previo = prestamos[idx];
  const actualizacion = req.body;
  if (actualizacion.fecha_devolucion && !previo.fecha_devolucion) {
    const libro = libros.find(b => b.id === previo.id_libro);
    if (libro) libro.existencia += 1;
  }
  prestamos[idx] = { ...prestamos[idx], ...actualizacion };
  res.json(prestamos[idx]);
});

app.delete('/prestamos/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = prestamos.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
  const eliminado = prestamos.splice(idx, 1)[0];
  const libro = libros.find(b => b.id === eliminado.id_libro);
  if (libro && !eliminado.fecha_devolucion) libro.existencia += 1;
  res.json({ mensaje: 'Eliminado', eliminado });
});

// --- Reseñas ---
app.get('/resenias', (req, res) => res.json(resenias));

app.get('/resenias/:id', (req, res) => {
  const id = Number(req.params.id);
  const r = resenias.find(x => x.id === id);
  if (!r) return res.status(404).json({ mensaje: 'Reseña no encontrada' });
  res.json(r);
});

app.get('/resenias/libro/:id_libro', (req, res) => {
  const id_libro = Number(req.params.id_libro);
  res.json(resenias.filter(r => r.id_libro === id_libro));
});

app.post('/resenias', (req, res) => {
  const { id_libro, id_usuario, puntuacion = null, comentario = '' } = req.body;
  if (!id_libro || !id_usuario) return res.status(400).json({ mensaje: 'id_libro e id_usuario son requeridos' });
  const r = { id: siguienteId(resenias), id_libro: Number(id_libro), id_usuario: Number(id_usuario), puntuacion, comentario };
  resenias.push(r);
  res.status(201).json(r);
});

app.put('/resenias/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = resenias.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ mensaje: 'Reseña no encontrada' });
  resenias[idx] = { ...resenias[idx], ...req.body };
  res.json(resenias[idx]);
});

app.delete('/resenias/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = resenias.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ mensaje: 'Reseña no encontrada' });
  const eliminado = resenias.splice(idx, 1)[0];
  res.json({ mensaje: 'Eliminado', eliminado });
});

// --- Lógicas específicas ---
app.get('/libros/disponibles', (req, res) => res.json(libros.filter(b => Number(b.existencia) > 0)));

app.get('/prestamos/usuario/:id_usuario', (req, res) => {
  const id_usuario = Number(req.params.id_usuario);
  res.json(prestamos.filter(p => p.id_usuario === id_usuario));
});

app.get('/prestamos/libro/:id_libro', (req, res) => {
  const id_libro = Number(req.params.id_libro);
  res.json(prestamos.filter(p => p.id_libro === id_libro));
});

app.get('/', (req, res) => res.send({ mensaje: 'Servidor RESTFull_API en ejecución' }));

app.listen(PUERTO, () => console.log(`Servidor corriendo en http://localhost:${PUERTO}`));
