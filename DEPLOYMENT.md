# 4Word Deployment Checklist

## Pre-Deployment

- [ ] All tests passing
- [ ] Database cleared of test data
- [ ] HTTPS configured (Let's Encrypt)
- [ ] CSP headers configured
- [ ] Rate limiting enabled
- [ ] Error logging configured

## Deploy Steps

1. Build production: `./build-production.sh`
2. Upload `dist/` to server
3. Configure nginx/apache for HTTPS
4. Test on production URL
5. Run test suite on production

## Post-Deployment

- [ ] Verify HTTPS works
- [ ] Run production tests
- [ ] Monitor error logs
- [ ] Set up backups (if needed)

## Security Notes

- **Never** deploy over HTTP in production
- Enable HSTS headers
- Set up CSP headers
- Consider rate limiting API calls
- Regular security audits recommended
