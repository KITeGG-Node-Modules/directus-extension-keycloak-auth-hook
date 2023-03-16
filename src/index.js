export default ({filter, action}, {logger, services}) => {
  async function updateGroups (payload, meta, context) {
    const {provider, providerPayload} = meta
    const {ItemsService} = services
    if (provider === 'keycloak' && providerPayload) {
      const {userInfo} = providerPayload
      const keys = Object.keys(userInfo || {})
      const groups = keys.filter(key => key.startsWith('groups.')).map(key => userInfo[key])
      const mappingService = new ItemsService('RoleGroupMapping', context)
      const institution = groups.find(group => ['hsm', 'hfgo', 'hfgg', 'hst', 'kisd'].includes(group))
      const status = groups.find(group => ['staff', 'student'].includes(group))
      logger.info(`GROUPS: ${groups.join(', ')}`)
      if (institution && status) {
        try {
          const groupId = `${institution}-${status}`
          logger.info(`GROUP ID: ${groupId}`)
          const results = await mappingService.readByQuery({
            filter: {
              groupId
            }
          })
          const role = results.map(mapping => mapping.roleId).shift()
          if (role) {
            logger.info(`ROLE ID: ${role}`)
            payload.role = role
          }
        } catch (e) {
          logger.error(e.message)
          logger.error(e.stack)
        }
      }
    }
    return payload
  }

  filter('auth.create', (payload, meta, context) => {
    logger.info('auth.create')
    return updateGroups(payload, meta, context)
  })

  filter('auth.update', (payload, meta, context) => {
    logger.info('auth.update')
    return updateGroups(payload, meta, context)
  })
};
