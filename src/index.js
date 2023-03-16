export default ({filter, action}, {logger, services}) => {
  async function setRoleFromKeycloakGroups (payload, meta, context) {
    const {provider, providerPayload} = meta
    const {ItemsService} = services
    if (provider === 'keycloak' && providerPayload) {
      const {userInfo} = providerPayload
      const keys = Object.keys(userInfo || {})
      const keycloakGroups = keys.filter(key => key.startsWith('groups.')).map(key => userInfo[key])
      const mappingService = new ItemsService('role_group_mapping', context)
      const institution = keycloakGroups.find(group => ['hsm', 'hfgo', 'hfgg', 'hst', 'kisd'].includes(group))
      const status = keycloakGroups.find(group => ['staff', 'student'].includes(group))
      logger.info(`keycloakGroups: ${keycloakGroups.join(', ')}`)
      if (institution && status) {
        try {
          const groupId = `${institution}-${status}`
          logger.info(`groupId: ${groupId}`)
          const results = await mappingService.readByQuery({
            filter: {
              groupId
            }
          })
          const roleId = results.map(mapping => mapping.roleId).shift()
          if (roleId) {
            logger.info(`roleId: ${roleId}`)
            payload.role = roleId
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
    return setRoleFromKeycloakGroups(payload, meta, context)
  })

  filter('auth.update', (payload, meta, context) => {
    logger.info('auth.update')
    return setRoleFromKeycloakGroups(payload, meta, context)
  })
};
