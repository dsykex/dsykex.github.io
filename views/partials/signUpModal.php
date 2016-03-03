<div class="reveal-modal" id="signUpModal" data-reveal>
    <form method="post">
        <input type="text" ng-model="user.email" placeholder="Email" />
        <input type="text" ng-model="user.dislay_name" placeholder="Display Name" />
        <input type="password" ng-model="user.password" placeholder="Password" />
        <input type="password" ng-model="user.conf_password" placeholder="Confirm Password" />
        <input type="text" ng-model="user.picture" placeholder="Profile Picture URL" />
        <input type="submit" class="button small radius" value="Sign Up!" ng-click="signup(user)"/>
    </form>
</div>