// Custom JSON body parser with smart quote sanitization
app.use(express.text({ type: '*/*', limit: '10mb' }));
app.use((req, res, next) => {
  // Skip if no body or not JSON-like content
  if (!req.body || (typeof req.body !== 'string' && !Buffer.isBuffer(req.body))) {
    return next();
  }

  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json')) {
    // If it's not JSON content type, skip JSON parsing
    return next();
  }

  try {
    // Try to parse the body as JSON
    const bodyStr = typeof req.body === 'string' ? req.body : req.body.toString();
    req.body = JSON.parse(bodyStr);
    next();
  } catch (err) {
    // Initial parse failed - try sanitizing smart quotes
    console.log('⚠️  JSON parse error, attempting to sanitize smart quotes...');
    try {
      const bodyStr = typeof req.body === 'string' ? req.body : req.body.toString();
      const sanitized = bodyStr
        .replace(/[\u2018\u2019]/g, "'")   // ' ' → '
        .replace(/[\u201C\u201D]/g, '"')   // " " → "
        .replace(/[\u201A\u201E]/g, '"')   // „ ‚ → "
        .replace(/[\u2039\u203A]/g, "'")   // ‹ › → '
        .replace(/[\u00AB\u00BB]/g, '"');  // « » → "

      console.log('📝 Original (first 150 chars):', bodyStr.substring(0, 150));
      console.log('📝 Sanitized (first 150 chars):', sanitized.substring(0, 150));

      req.body = JSON.parse(sanitized);
      console.log('✅ Successfully parsed after sanitization');
      next();
    } catch (parseErr) {
      console.error('❌ Still failed to parse after sanitization:', parseErr.message);
      const bodyStr = typeof req.body === 'string' ? req.body : req.body.toString();
      console.error('Body (first 300 chars):', bodyStr.substring(0, 300));
      return res.status(400).json({
        error: 'Invalid JSON in request body',
        details: parseErr.message,
        hint: 'Make sure your JSON uses straight quotes (") not curly quotes (" ")'
      });
    }
  }
});
