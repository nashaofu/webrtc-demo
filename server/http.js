module.exports = app => {
  let d1
  let d2
  app.use(async (ctx, next) => {
    if (!ctx.path.startsWith('/api')) {
      return next()
    }
    console.log('/api', ctx.query.i)

    if (ctx.request.body) {
      if (ctx.query.i) {
        d1 = ctx.request.body
        d2 = undefined
        await new Promise((resolve, reject) => {
          setInterval(() => {
            if (d2) {
              resolve()
            }
          }, 1000)
        })
        ctx.body = d2
      } else {
        d2 = ctx.request.body
        ctx.body = d1
      }
    }
    console.log('/api', !!d1, !!d2)
    await next()
  })

  app.use(async (ctx, next) => {
    if (ctx.path.startsWith('/get')) {
      ctx.body = d1
    }
    await next()
  })

  let i1
  let i2
  app.use(async (ctx, next) => {
    if (!ctx.path.startsWith('/candidate')) {
      return next()
    }
    console.log('/candidate', ctx.query.i)
    if (ctx.request.body) {
      if (ctx.query.i) {
        i1 = ctx.request.body
        i2 = undefined
        await new Promise((resolve, reject) => {
          setInterval(() => {
            if (i2) {
              resolve()
            }
          }, 1000)
        })
        ctx.body = i2
      } else {
        i2 = ctx.request.body
        ctx.body = i1
      }
    }
    console.log('/candidate', !!i1, !!i2)
    await next()
  })
}
